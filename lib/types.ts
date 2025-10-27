// ============================================================================
// ENHANCED TYPE DEFINITIONS - DELIVERY MANAGEMENT PRO
// ============================================================================

export type UserRole = "admin" | "driver"
export type OrderStatus = "pending" | "assigned" | "in_transit" | "delivered" | "failed"
export type RouteStatus = "draft" | "active" | "completed"
export type EventType = "arrived" | "delivered" | "failed"
export type GeocodeStatus = "pending" | "success" | "failed" | "skipped"

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Profile {
  id: string
  email: string
  role: UserRole
  display_name: string | null
  created_at: string
  // Enhanced driver fields
  vehicle_capacity?: number | null
  shift_start?: string | null
  shift_end?: string | null
  depot_lat?: number | null
  depot_lng?: number | null
  driver_skills?: string[] | null
}

export interface Order {
  id: string
  customer_name: string
  customer_email: string
  address: string
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  status: OrderStatus
  route_id: string | null
  stop_sequence: number | null
  created_at: string
  updated_at: string
  // Enhanced geocoding fields
  geocode_at?: string | null
  geocode_label?: string | null
  geocode_status?: GeocodeStatus | null
  geocode_error?: string | null
  // Enhanced VRP fields
  tw_start?: string | null
  tw_end?: string | null
  service_seconds?: number | null
  service_minutes?: number | null
  required_skills?: string[] | null
  quantity?: number | null
  // Enhanced address fields
  address_line1?: string | null
  delivery_address?: string | null
  full_address?: string | null
  state_province?: string | null
  postal_code?: string | null
  country?: string | null
}

export interface Route {
  id: string
  name: string
  driver_id: string | null
  status: RouteStatus
  total_stops: number
  completed_stops: number
  created_at: string
  updated_at: string
  // Enhanced routing fields
  total_distance_m?: number | null
  total_duration_s?: number | null
  vehicle_count?: number | null
  depot_lat?: number | null
  depot_lng?: number | null
  raw_solution_json?: any | null
  // Enhanced metrics fields
  distance_km?: number | null
  duration_sec?: number | null
  drive_time_sec?: number | null
  service_time_sec?: number | null
  metrics_updated_at?: string | null
}

export interface POD {
  id: string
  order_id: string
  driver_id: string
  photo_url: string | null
  signature_url: string | null
  notes: string | null
  recipient_name?: string | null
  delivered_at: string
}

export interface StopEvent {
  id: string
  order_id: string
  driver_id: string
  event_type: EventType
  notes: string | null
  created_at: string
}

export interface RouteStop {
  id: string
  route_id: string
  order_id: string
  sequence: number
  lat: number
  lng: number
  eta?: string | null
  etd?: string | null
  created_at: string
}

export interface DriverPosition {
  id: string
  driver_id: string
  lat: number
  lng: number
  accuracy?: number | null
  updated_at: string
}

export interface PODEmail {
  pod_id: string
  order_id: string
  to_email: string
  sent_at: string
  provider_message_id?: string | null
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface CreateOrderForm {
  customer_name: string
  customer_email: string
  address: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  notes?: string
  tw_start?: string
  tw_end?: string
  service_minutes?: number
  required_skills?: string[]
  quantity?: number
}

export interface CreateRouteForm {
  name: string
  driver_id?: string
  orders: string[]
}

export interface UpdateOrderStatusForm {
  status: OrderStatus
  notes?: string
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface OrderTableProps {
  orders: Order[]
  onOrderSelect?: (order: Order) => void
  onOrderUpdate?: (order: Order) => void
  loading?: boolean
}

export interface RouteTableProps {
  routes: Route[]
  onRouteSelect?: (route: Route) => void
  onRouteUpdate?: (route: Route) => void
  loading?: boolean
}

export interface MapProps {
  orders?: Order[]
  routes?: Route[]
  driverPositions?: DriverPosition[]
  onOrderClick?: (order: Order) => void
  onRouteClick?: (route: Route) => void
  className?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ============================================================================
// DATABASE TYPES (Supabase Generated)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
      }
      routes: {
        Row: Route
        Insert: Omit<Route, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Route, 'id' | 'created_at'>>
      }
      pods: {
        Row: POD
        Insert: Omit<POD, 'id' | 'delivered_at'>
        Update: Partial<Omit<POD, 'id' | 'delivered_at'>>
      }
      stop_events: {
        Row: StopEvent
        Insert: Omit<StopEvent, 'id' | 'created_at'>
        Update: Partial<Omit<StopEvent, 'id' | 'created_at'>>
      }
      route_stops: {
        Row: RouteStop
        Insert: Omit<RouteStop, 'id' | 'created_at'>
        Update: Partial<Omit<RouteStop, 'id' | 'created_at'>>
      }
      driver_positions: {
        Row: DriverPosition
        Insert: Omit<DriverPosition, 'id' | 'updated_at'>
        Update: Partial<Omit<DriverPosition, 'id' | 'updated_at'>>
      }
      pod_emails: {
        Row: PODEmail
        Insert: Omit<PODEmail, 'sent_at'>
        Update: Partial<Omit<PODEmail, 'pod_id' | 'sent_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      upsert_driver_position: {
        Args: {
          p_driver_id: string
          p_lat: number
          p_lng: number
          p_accuracy?: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ORDER_STATUSES: OrderStatus[] = ["pending", "assigned", "in_transit", "delivered", "failed"]
export const ROUTE_STATUSES: RouteStatus[] = ["draft", "active", "completed"]
export const USER_ROLES: UserRole[] = ["admin", "driver"]
export const EVENT_TYPES: EventType[] = ["arrived", "delivered", "failed"]

export const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
} as const

export const MOBILE_BREAKPOINT = 768
export const TABLET_BREAKPOINT = 1024
export const DESKTOP_BREAKPOINT = 1280