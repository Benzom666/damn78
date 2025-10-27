// ============================================================================
// APPLICATION CONSTANTS
// ============================================================================

export const APP_CONFIG = {
  name: "Delivery Management Pro",
  version: "2.0.0",
  description: "Professional delivery and route management system",
  author: "AI Amplified Solutions",
  contact: "info@aiamplifiedsolutions.com",
} as const

export const API_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const

export const MAP_CONFIG = {
  defaultCenter: { lat: 40.7128, lng: -74.0060 }, // New York
  defaultZoom: 12,
  maxZoom: 18,
  minZoom: 3,
  clusterRadius: 50,
} as const

export const ROUTE_CONFIG = {
  maxStopsPerRoute: 100,
  maxRoutesPerDriver: 5,
  defaultServiceTime: 300, // 5 minutes in seconds
  maxTimeWindow: 24 * 60 * 60, // 24 hours in seconds
} as const

export const VALIDATION_CONFIG = {
  minPasswordLength: 8,
  maxNameLength: 100,
  maxAddressLength: 500,
  maxNotesLength: 1000,
  phoneRegex: /^[\+]?[1-9][\d]{0,15}$/,
  emailRegex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
} as const

export const UI_CONFIG = {
  toastDuration: 5000,
  loadingDelay: 200,
  animationDuration: 300,
  debounceDelay: 500,
} as const

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
  AUTH_EXPIRED: "Your session has expired. Please log in again.",
  PERMISSION_DENIED: "You don't have permission to perform this action.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  FILE_TOO_LARGE: "File size exceeds the maximum limit of 10MB.",
  INVALID_FILE_TYPE: "Invalid file type. Please upload a valid image file.",
} as const

export const SUCCESS_MESSAGES = {
  ORDER_CREATED: "Order created successfully",
  ORDER_UPDATED: "Order updated successfully",
  ORDER_DELETED: "Order deleted successfully",
  ROUTE_CREATED: "Route created successfully",
  ROUTE_UPDATED: "Route updated successfully",
  ROUTE_DELETED: "Route deleted successfully",
  DELIVERY_COMPLETED: "Delivery marked as completed",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
} as const

export const FEATURE_FLAGS = {
  ENABLE_REAL_TIME_TRACKING: true,
  ENABLE_ROUTE_OPTIMIZATION: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_SMS_NOTIFICATIONS: false,
  ENABLE_ANALYTICS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_OFFLINE_MODE: false,
} as const