"use server"

// ============================================================================
// ENHANCED DRIVER ACTIONS - 100X RELIABILITY UPGRADE
// ============================================================================

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { ApiResponse } from "@/lib/types"
import { API_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/utils/constants"
import { validateForm, deliveryUpdateSchema, driverPositionSchema } from "@/lib/utils/validation"

// ============================================================================
// ENHANCED ERROR HANDLING & RETRY LOGIC
// ============================================================================

class RetryableError extends Error {
  constructor(message: string, public retryable = true) {
    super(message)
    this.name = 'RetryableError'
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = API_CONFIG.retryAttempts,
  delay = API_CONFIG.retryDelay,
  context = 'operation'
): Promise<T> {
  let lastError: Error = new Error('No attempts made')

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      if (attempt > 0) {
        console.log(`[v0] ${context} succeeded after ${attempt} retries`)
      }
      return result
    } catch (error) {
      lastError = error as Error
      
      // Don't retry auth errors or validation errors
      if (error instanceof Error && (
        error.message.includes('AUTH_EXPIRED') ||
        error.message.includes('VALIDATION_ERROR') ||
        error.message.includes('PERMISSION_DENIED')
      )) {
        throw error
      }

      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt) // Exponential backoff
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.warn(`[v0] ${context} attempt ${attempt + 1} failed, retrying in ${waitTime}ms:`, errorMessage)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  console.error(`[v0] ${context} failed after ${maxRetries + 1} attempts:`, lastError)
  throw new RetryableError(`${context} failed: ${lastError.message}`)
}

async function validateAuth(supabase: any): Promise<{ user: any; profile: any }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0] Auth validation failed:", authError)
    throw new Error("AUTH_EXPIRED")
  }

  // Get user profile with enhanced error handling
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("[v0] Profile fetch failed:", profileError)
    throw new Error("PROFILE_NOT_FOUND")
  }

  if (profile.role !== "driver") {
    console.error("[v0] Invalid role for driver action:", profile.role)
    throw new Error("PERMISSION_DENIED")
  }

  return { user, profile }
}

// ============================================================================
// ENHANCED ORDER STATUS UPDATE
// ============================================================================

export async function updateStopStatus(
  orderId: string,
  status: "delivered" | "failed",
  notes?: string,
): Promise<ApiResponse> {
  const context = `updateStopStatus(${orderId}, ${status})`
  
  try {
    // Input validation
    const validation = validateForm(deliveryUpdateSchema, { status, notes })
    if (!validation.success) {
      return {
        success: false,
        error: "VALIDATION_ERROR",
        message: Object.values(validation.errors || {}).flat().join(', ')
      }
    }

    const supabase = await createServerClient()
    const { user, profile } = await validateAuth(supabase)

    // Verify order exists and driver has access
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, routes!inner(driver_id)")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return {
        success: false,
        error: "ORDER_NOT_FOUND",
        message: "Order not found or access denied"
      }
    }

    if (order.routes.driver_id !== user.id) {
      return {
        success: false,
        error: "PERMISSION_DENIED",
        message: "You don't have permission to update this order"
      }
    }

    // Prevent duplicate status updates
    if (order.status === status) {
      return {
        success: true,
        message: `Order already marked as ${status}`
      }
    }

    // Update order status with retry logic
    await withRetry(async () => {
      const { error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (error) throw new Error(`Database update failed: ${error.message}`)
    }, API_CONFIG.retryAttempts, API_CONFIG.retryDelay, `${context} - order update`)

    // Log stop event (non-blocking)
    try {
      await supabase.from("stop_events").insert({
        order_id: orderId,
        driver_id: user.id,
        event_type: status,
        notes: notes || null,
      })
    } catch (eventError) {
      console.warn("[v0] Failed to log stop event (non-blocking):", eventError)
    }

    // Update route completion metrics (non-blocking)
    try {
      if (status === "delivered") {
        const { data: routeOrders } = await supabase
          .from("orders")
          .select("status")
          .eq("route_id", order.route_id)

        if (routeOrders) {
          const completedCount = routeOrders.filter(o => o.status === "delivered").length
          await supabase
            .from("routes")
            .update({ 
              completed_stops: completedCount,
              updated_at: new Date().toISOString()
            })
            .eq("id", order.route_id)
        }
      }
    } catch (metricsError) {
      console.warn("[v0] Failed to update route metrics (non-blocking):", metricsError)
    }

    revalidatePath("/driver")
    revalidatePath(`/driver/routes/${order.route_id}`)

    return {
      success: true,
      message: status === "delivered" ? SUCCESS_MESSAGES.DELIVERY_COMPLETED : "Order marked as failed"
    }

  } catch (error) {
    console.error(`[v0] ${context} error:`, error)
    
    if (error instanceof Error) {
      if (error.message === "AUTH_EXPIRED") {
        return {
          success: false,
          error: "AUTH_EXPIRED",
          message: "Your session has expired. Please log in again.",
          code: "AUTH_EXPIRED",
        }
      }
      
      if (error.message === "PERMISSION_DENIED") {
        return {
          success: false,
          error: "PERMISSION_DENIED",
          message: ERROR_MESSAGES.PERMISSION_DENIED,
        }
      }
    }

    return {
      success: false,
      error: "SERVER_ERROR",
      message: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR,
    }
  }
}

// ============================================================================
// ENHANCED POD SAVING
// ============================================================================

export async function savePOD(
  orderId: string,
  photoUrl?: string,
  signatureUrl?: string,
  notes?: string,
  recipientName?: string,
): Promise<ApiResponse> {
  const context = `savePOD(${orderId})`
  
  try {
    const supabase = await createServerClient()
    const { user } = await validateAuth(supabase)

    // Verify order exists and driver has access
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, routes!inner(driver_id)")
      .eq("id", orderId)
      .single()

    if (orderError || !order || order.routes.driver_id !== user.id) {
      return {
        success: false,
        error: "ORDER_NOT_FOUND",
        message: "Order not found or access denied"
      }
    }

    // Check if POD already exists
    const { data: existingPod } = await supabase
      .from("pods")
      .select("id")
      .eq("order_id", orderId)
      .single()

    const podNotes = recipientName ? `Recipient: ${recipientName}\n${notes || ""}` : notes

    let podData
    if (existingPod) {
      // Update existing POD
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from("pods")
          .update({
            photo_url: photoUrl,
            signature_url: signatureUrl,
            notes: podNotes,
            delivered_at: new Date().toISOString(),
          })
          .eq("id", existingPod.id)
          .select("id")
          .single()
      }, API_CONFIG.retryAttempts, API_CONFIG.retryDelay, `${context} - POD update`)

      if (error) throw new Error(`POD update failed: ${error.message}`)
      podData = data
    } else {
      // Create new POD
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from("pods")
          .insert({
            order_id: orderId,
            driver_id: user.id,
            photo_url: photoUrl,
            signature_url: signatureUrl,
            notes: podNotes,
            delivered_at: new Date().toISOString(),
          })
          .select("id")
          .single()
      }, API_CONFIG.retryAttempts, API_CONFIG.retryDelay, `${context} - POD insert`)

      if (error) throw new Error(`POD creation failed: ${error.message}`)
      podData = data
    }

    // Send POD email if enabled (fire-and-forget)
    if (podData?.id && process.env.NEXT_PUBLIC_ENABLE_POD_EMAIL === "true" && order.customer_email) {
      console.log("[v0] [POD] Triggering email for POD:", podData.id)
      
      // Use fetch with enhanced error handling
      fetch("/api/pod-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "User-Agent": "DeliveryApp/2.0"
        },
        body: JSON.stringify({ 
          orderId, 
          podId: podData.id,
          customerEmail: order.customer_email,
          customerName: order.customer_name
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          const result = await response.json()
          console.log("[v0] [POD] Email sent successfully:", result)
        })
        .catch((error) => {
          console.warn("[v0] [POD] Email sending failed (non-blocking):", error.message)
        })
    }

    revalidatePath("/driver")
    revalidatePath(`/driver/routes/${order.route_id}`)

    return { 
      success: true,
      data: podData,
      message: "Proof of delivery saved successfully"
    }

  } catch (error) {
    console.error(`[v0] ${context} error:`, error)
    
    if (error instanceof Error) {
      if (error.message === "AUTH_EXPIRED") {
        return {
          success: false,
          error: "AUTH_EXPIRED",
          message: "Your session has expired. Please log in again.",
          code: "AUTH_EXPIRED",
        }
      }
    }

    return {
      success: false,
      error: "SERVER_ERROR",
      message: error instanceof Error ? error.message : ERROR_MESSAGES.SERVER_ERROR,
    }
  }
}

// ============================================================================
// ENHANCED BLOB UPLOAD
// ============================================================================

export async function uploadToBlob(
  base64Data: string, 
  filename: string, 
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const context = `uploadToBlob(${filename})`
  
  try {
    // Validate file size
    const sizeInBytes = (base64Data.length * 3) / 4
    if (sizeInBytes > API_CONFIG.maxFileSize) {
      return { 
        url: null, 
        error: ERROR_MESSAGES.FILE_TOO_LARGE 
      }
    }

    // Validate content type
    const allowedTypes = API_CONFIG.allowedImageTypes as readonly string[]
    if (!allowedTypes.includes(contentType)) {
      return { 
        url: null, 
        error: ERROR_MESSAGES.INVALID_FILE_TYPE 
      }
    }

    let blob: Blob

    // Enhanced base64 processing for mobile compatibility
    if (base64Data.startsWith('data:')) {
      // Handle data URL format (common on mobile)
      try {
        const response = await fetch(base64Data)
        blob = await response.blob()
      } catch (fetchError) {
        // Fallback: manual base64 decoding
        const base64String = base64Data.split(',')[1]
        const byteCharacters = atob(base64String)
        const byteNumbers = new Array(byteCharacters.length)
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        blob = new Blob([byteArray], { type: contentType })
      }
    } else {
      // Handle raw base64 string
      const byteCharacters = atob(base64Data.split(',')[1] || base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      blob = new Blob([byteArray], { type: contentType })
    }

    // Upload with retry logic
    const result = await withRetry(async () => {
      return await put(filename, blob, {
        access: "public",
        contentType,
        addRandomSuffix: true, // Prevent filename conflicts
      })
    }, API_CONFIG.retryAttempts, API_CONFIG.retryDelay, context)

    console.log(`[v0] ${context} successful:`, result.url)
    return { url: result.url, error: null }

  } catch (error) {
    console.error(`[v0] ${context} error:`, error)
    return { 
      url: null, 
      error: error instanceof Error ? error.message : "Upload failed" 
    }
  }
}

// ============================================================================
// ENHANCED DRIVER POSITION UPDATE
// ============================================================================

export async function updateDriverPosition(
  lat: number, 
  lng: number, 
  accuracy?: number
): Promise<ApiResponse> {
  const context = `updateDriverPosition(${lat}, ${lng})`
  
  try {
    // Validate coordinates
    const validation = validateForm(driverPositionSchema, { lat, lng, accuracy })
    if (!validation.success) {
      return {
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid coordinates provided"
      }
    }

    const supabase = await createServerClient()
    const { user } = await validateAuth(supabase)

    // Update position with retry logic
    await withRetry(async () => {
      const { error } = await supabase.rpc("upsert_driver_position", {
        p_driver_id: user.id,
        p_lat: lat,
        p_lng: lng,
        p_accuracy: accuracy || null,
      })

      if (error) throw new Error(`Position update failed: ${error.message}`)
    }, API_CONFIG.retryAttempts, API_CONFIG.retryDelay, context)

    return { success: true }

  } catch (error) {
    console.error(`[v0] ${context} error:`, error)
    
    if (error instanceof Error && error.message === "AUTH_EXPIRED") {
      return {
        success: false,
        error: "AUTH_EXPIRED",
        message: "Authentication required",
        code: "AUTH_EXPIRED",
      }
    }

    return {
      success: false,
      error: "SERVER_ERROR",
      message: error instanceof Error ? error.message : "Failed to update position",
    }
  }
}

// ============================================================================
// BATCH OPERATIONS FOR EFFICIENCY
// ============================================================================

export async function batchUpdateOrderStatuses(
  updates: Array<{ orderId: string; status: "delivered" | "failed"; notes?: string }>
): Promise<ApiResponse<{ successful: string[]; failed: string[] }>> {
  const context = "batchUpdateOrderStatuses"
  
  try {
    const supabase = await createServerClient()
    const { user } = await validateAuth(supabase)

    const successful: string[] = []
    const failed: string[] = []

    // Process updates in batches of 10 for better performance
    const batchSize = 10
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (update) => {
          try {
            const result = await updateStopStatus(update.orderId, update.status, update.notes)
            if (result.success) {
              successful.push(update.orderId)
            } else {
              failed.push(update.orderId)
            }
          } catch (error) {
            console.error(`[v0] Batch update failed for order ${update.orderId}:`, error)
            failed.push(update.orderId)
          }
        })
      )
    }

    revalidatePath("/driver")

    return {
      success: true,
      data: { successful, failed },
      message: `Updated ${successful.length} orders successfully, ${failed.length} failed`
    }

  } catch (error) {
    console.error(`[v0] ${context} error:`, error)
    return {
      success: false,
      error: "SERVER_ERROR",
      message: error instanceof Error ? error.message : "Batch update failed",
    }
  }
}