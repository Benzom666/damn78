// ============================================================================
// ENHANCED VALIDATION UTILITIES
// ============================================================================

import { z } from 'zod'
import { VALIDATION_CONFIG, ROUTE_CONFIG } from './constants'

// ============================================================================
// BASIC VALIDATORS
// ============================================================================

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')

export const phoneSchema = z
  .string()
  .regex(VALIDATION_CONFIG.phoneRegex, 'Invalid phone number format')
  .optional()
  .or(z.literal(''))

export const passwordSchema = z
  .string()
  .min(VALIDATION_CONFIG.minPasswordLength, `Password must be at least ${VALIDATION_CONFIG.minPasswordLength} characters`)

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(VALIDATION_CONFIG.maxNameLength, `Name must be less than ${VALIDATION_CONFIG.maxNameLength} characters`)

export const addressSchema = z
  .string()
  .min(1, 'Address is required')
  .max(VALIDATION_CONFIG.maxAddressLength, `Address must be less than ${VALIDATION_CONFIG.maxAddressLength} characters`)

export const notesSchema = z
  .string()
  .max(VALIDATION_CONFIG.maxNotesLength, `Notes must be less than ${VALIDATION_CONFIG.maxNotesLength} characters`)
  .optional()

export const coordinateSchema = z
  .number()
  .min(-180, 'Invalid coordinate')
  .max(180, 'Invalid coordinate')

// ============================================================================
// FORM SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: nameSchema.optional(),
  role: z.enum(['admin', 'driver']).default('driver'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const profileUpdateSchema = z.object({
  display_name: nameSchema.optional(),
  vehicle_capacity: z.number().min(1).max(10000).optional(),
  shift_start: z.string().optional(),
  shift_end: z.string().optional(),
  depot_lat: coordinateSchema.optional(),
  depot_lng: coordinateSchema.optional(),
  driver_skills: z.array(z.string()).optional(),
})

export const orderSchema = z.object({
  customer_name: nameSchema,
  customer_email: emailSchema,
  address: addressSchema,
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: phoneSchema,
  notes: notesSchema,
  tw_start: z.string().datetime().optional(),
  tw_end: z.string().datetime().optional(),
  service_minutes: z.number().min(0).max(1440).optional(),
  required_skills: z.array(z.string()).optional(),
  quantity: z.number().min(1).max(1000).optional(),
})

export const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required').max(100, 'Route name too long'),
  driver_id: z.string().uuid('Invalid driver ID').optional(),
  orders: z.array(z.string().uuid('Invalid order ID')).min(1, 'At least one order is required'),
})

export const deliveryUpdateSchema = z.object({
  status: z.enum(['delivered', 'failed']),
  notes: notesSchema,
  recipient_name: z.string().max(100).optional(),
  photo_url: z.string().url().optional(),
  signature_url: z.string().url().optional(),
})

export const driverPositionSchema = z.object({
  lat: coordinateSchema,
  lng: coordinateSchema,
  accuracy: z.number().min(0).optional(),
})

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateEmail(email: string): boolean {
  return VALIDATION_CONFIG.emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  return VALIDATION_CONFIG.phoneRegex.test(phone)
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export function validateTimeWindow(start: string, end: string): boolean {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return startDate < endDate && (endDate.getTime() - startDate.getTime()) <= ROUTE_CONFIG.maxTimeWindow * 1000
}

export function validateFileSize(file: File, maxSize = 10 * 1024 * 1024): boolean {
  return file.size <= maxSize
}

export function validateImageType(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\-\s()]/g, '')
}

export function sanitizeAddress(address: string): string {
  return address.trim().replace(/[<>]/g, '').substring(0, VALIDATION_CONFIG.maxAddressLength)
}

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

export type ValidationResult<T> = {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
}

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach(err => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: ['Validation failed'] } }
  }
}

export function getFieldError(
  errors: Record<string, string[]> | undefined,
  field: string
): string | undefined {
  return errors?.[field]?.[0]
}

export function hasFieldError(
  errors: Record<string, string[]> | undefined,
  field: string
): boolean {
  return Boolean(errors?.[field]?.length)
}