// ============================================================================
// REAL-TIME DATA HOOKS
// ============================================================================

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, Route, DriverPosition } from '@/lib/types'

export function useRealtimeOrders(initialOrders: Order[] = []) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change received:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setOrders(prev => [...prev, payload.new as Order])
              break
            case 'UPDATE':
              setOrders(prev => 
                prev.map(order => 
                  order.id === payload.new.id ? payload.new as Order : order
                )
              )
              break
            case 'DELETE':
              setOrders(prev => 
                prev.filter(order => order.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const updateOrder = useCallback((updatedOrder: Order) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    )
  }, [])

  const addOrder = useCallback((newOrder: Order) => {
    setOrders(prev => [...prev, newOrder])
  }, [])

  const removeOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId))
  }, [])

  return {
    orders,
    updateOrder,
    addOrder,
    removeOrder,
    setOrders,
  }
}

export function useRealtimeRoutes(initialRoutes: Route[] = []) {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('routes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'routes',
        },
        (payload) => {
          console.log('Route change received:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setRoutes(prev => [...prev, payload.new as Route])
              break
            case 'UPDATE':
              setRoutes(prev => 
                prev.map(route => 
                  route.id === payload.new.id ? payload.new as Route : route
                )
              )
              break
            case 'DELETE':
              setRoutes(prev => 
                prev.filter(route => route.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const updateRoute = useCallback((updatedRoute: Route) => {
    setRoutes(prev => 
      prev.map(route => 
        route.id === updatedRoute.id ? updatedRoute : route
      )
    )
  }, [])

  const addRoute = useCallback((newRoute: Route) => {
    setRoutes(prev => [...prev, newRoute])
  }, [])

  const removeRoute = useCallback((routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId))
  }, [])

  return {
    routes,
    updateRoute,
    addRoute,
    removeRoute,
    setRoutes,
  }
}

export function useRealtimeDriverPositions() {
  const [positions, setPositions] = useState<DriverPosition[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('driver_positions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_positions',
        },
        (payload) => {
          console.log('Driver position change received:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
            case 'UPDATE':
              setPositions(prev => {
                const existing = prev.find(p => p.driver_id === payload.new.driver_id)
                if (existing) {
                  return prev.map(p => 
                    p.driver_id === payload.new.driver_id ? payload.new as DriverPosition : p
                  )
                } else {
                  return [...prev, payload.new as DriverPosition]
                }
              })
              break
            case 'DELETE':
              setPositions(prev => 
                prev.filter(p => p.driver_id !== payload.old.driver_id)
              )
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const updatePosition = useCallback((driverId: string, lat: number, lng: number, accuracy?: number) => {
    const newPosition: DriverPosition = {
      id: '', // Will be set by database
      driver_id: driverId,
      lat,
      lng,
      accuracy,
      updated_at: new Date().toISOString(),
    }

    setPositions(prev => {
      const existing = prev.find(p => p.driver_id === driverId)
      if (existing) {
        return prev.map(p => 
          p.driver_id === driverId ? { ...p, lat, lng, accuracy, updated_at: newPosition.updated_at } : p
        )
      } else {
        return [...prev, newPosition]
      }
    })
  }, [])

  return {
    positions,
    updatePosition,
    setPositions,
  }
}

export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(true)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('connection_test')

    channel
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true)
        setReconnectAttempts(0)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          setReconnectAttempts(prev => prev + 1)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const reconnect = useCallback(() => {
    setReconnectAttempts(prev => prev + 1)
    // Supabase will automatically attempt to reconnect
  }, [])

  return {
    isConnected,
    reconnectAttempts,
    reconnect,
  }
}