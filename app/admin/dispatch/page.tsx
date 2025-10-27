import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DispatchMonitor } from "./dispatch-monitor"
import Link from "next/link"
import type { Profile, Route, Order, POD, DriverPosition } from "@/lib/types"

export default async function DispatchPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !profile || (profile as Profile).role !== "admin") {
    redirect("/driver")
  }

  const typedProfile = profile as Profile

  // Get active routes with driver info
  const { data: routes } = await supabase
    .from("routes")
    .select("*, profiles(display_name, email)")
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })

  const typedRoutes = (routes || []) as Route[]

  // Get all orders for active routes
  const routeIds = typedRoutes.map((r) => r.id)

  let orders: Order[] = []
  if (routeIds.length > 0) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("route_id", routeIds)
      .order("stop_sequence", { ascending: true })
    orders = (data || []) as Order[]
  }

  // Get PODs for delivered orders
  const deliveredOrderIds = orders.filter((o) => o.status === "delivered").map((o) => o.id)

  let pods: POD[] = []
  if (deliveredOrderIds.length > 0) {
    const { data } = await supabase.from("pods").select("*").in("order_id", deliveredOrderIds)
    pods = (data || []) as POD[]
  }

  const driverIds = typedRoutes.map((r) => r.driver_id).filter(Boolean) as string[]
  let driverPositions: DriverPosition[] = []
  if (driverIds.length > 0 && process.env.NEXT_PUBLIC_ENABLE_DISPATCH_MAP === "true") {
    const { data } = await supabase
      .from("driver_positions")
      .select("*, profiles(display_name, email)")
      .in("driver_id", driverIds)
    driverPositions = (data || []) as DriverPosition[]
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-semibold">
              Admin Dashboard
            </Link>
            <nav className="flex gap-4">
              <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
                Orders
              </Link>
              <Link href="/admin/routes" className="text-sm text-muted-foreground hover:text-foreground">
                Routes
              </Link>
              <Link href="/admin/dispatch" className="text-sm font-medium">
                Dispatch
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{typedProfile.display_name || typedProfile.email}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-6">
        <DispatchMonitor
          routes={typedRoutes}
          orders={orders}
          pods={pods}
          driverPositions={driverPositions}
        />
      </main>
    </div>
  )
}