// ============================================================================
// ENHANCED API HOOKS
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { ApiResponse } from '@/lib/types'
import { apiClient, getErrorMessage } from '@/lib/utils/api'

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

export interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> & {
  execute: () => Promise<void>
  reset: () => void
} {
  const { immediate = false, onSuccess, onError } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall()
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
          success: true,
        })
        onSuccess?.(response.data)
      } else {
        const errorMessage = response.error || 'An error occurred'
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false,
        })
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      })
      onError?.(errorMessage)
    }
  }, [apiCall, onSuccess, onError])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    ...state,
    execute,
    reset,
  }
}

export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> & {
  mutate: (params: P) => Promise<void>
  reset: () => void
} {
  const { onSuccess, onError } = options

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  })

  const mutate = useCallback(async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await mutationFn(params)
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
          success: true,
        })
        onSuccess?.(response.data)
      } else {
        const errorMessage = response.error || 'An error occurred'
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false,
        })
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      })
      onError?.(errorMessage)
    }
  }, [mutationFn, onSuccess, onError])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    })
  }, [])

  return {
    ...state,
    mutate,
    reset,
  }
}

export function useInfiniteApi<T>(
  apiCall: (page: number, limit: number) => Promise<ApiResponse<{ data: T[]; hasMore: boolean }>>,
  options: { limit?: number } & UseApiOptions = {}
): UseApiState<T[]> & {
  loadMore: () => Promise<void>
  hasMore: boolean
  reset: () => void
} {
  const { limit = 20, onSuccess, onError } = options

  const [state, setState] = useState<UseApiState<T[]> & { hasMore: boolean }>({
    data: [],
    loading: false,
    error: null,
    success: false,
    hasMore: true,
  })

  const [page, setPage] = useState(1)

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiCall(page, limit)
      
      if (response.success && response.data) {
        const newData = response.data.data
        const hasMore = response.data.hasMore

        setState(prev => ({
          data: page === 1 ? newData : [...(prev.data || []), ...newData],
          loading: false,
          error: null,
          success: true,
          hasMore,
        }))

        setPage(prev => prev + 1)
        onSuccess?.(newData)
      } else {
        const errorMessage = response.error || 'An error occurred'
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          success: false,
        }))
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }))
      onError?.(errorMessage)
    }
  }, [apiCall, page, limit, state.loading, state.hasMore, onSuccess, onError])

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      success: false,
      hasMore: true,
    })
    setPage(1)
  }, [])

  useEffect(() => {
    loadMore()
  }, []) // Only run on mount

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    success: state.success,
    hasMore: state.hasMore,
    loadMore,
    reset,
  }
}

// Specialized hooks for common patterns
export function useOrders() {
  return useApi(() => apiClient.get('/api/orders'), { immediate: true })
}

export function useRoutes() {
  return useApi(() => apiClient.get('/api/routes'), { immediate: true })
}

export function useDriverPositions() {
  return useApi(() => apiClient.get('/api/driver-positions'), { immediate: true })
}