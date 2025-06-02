"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Coffee } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useApi from "@/hooks/use-api"
import type { Order, Table as TableType } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function TableOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const tableId = Number(params.tableId)
  const { toast } = useToast()
  const { isLoading, error, executeApiCall, api } = useApi()

  const [orders, setOrders] = useState<Order[]>([])
  const [table, setTable] = useState<TableType | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Load table info and orders on component mount
  useEffect(() => {
    if (tableId) {
      loadTableInfo()
      loadTableOrders()
    }
  }, [tableId])

  // Show error toast if API error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Load table information
  const loadTableInfo = async () => {
    const result = await executeApiCall(() => api.tables.getById(tableId))
    if (result) {
      setTable(result)
    }
  }

  // Load orders for this table
  const loadTableOrders = async () => {
    const result = await executeApiCall(() => api.orders.getByTable(tableId))
    if (result) {
      setOrders(result)
    }
  }

  // Go to menu page
  const goToMenu = () => {
    router.push(`/menu?table=${tableId}`)
  }

  // Refresh data
  const handleRefresh = () => {
    loadTableOrders()
    loadTableInfo()
  }

  // Format date/time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500">New</Badge>
      case "preparing":
        return <Badge className="bg-yellow-500">Preparing</Badge>
      case "ready":
        return <Badge className="bg-green-500">Ready</Badge>
      case "delivered":
        return <Badge className="bg-purple-500">Delivered</Badge>
      case "paid":
        return <Badge className="bg-gray-500">Paid</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Handle viewing order details
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDetailsOpen(true)
  }

  // Handle cancelling an order
  const handleCancelOrder = async () => {
    if (!selectedOrder) return

    setIsCancelling(true)

    try {
      await executeApiCall(() => api.orders.delete(selectedOrder.id))

      // Remove the order from the list
      setOrders(orders.filter((order) => order.id !== selectedOrder.id))

      // Reset selected order and close dialogs
      setSelectedOrder(null)
      setIsOrderDetailsOpen(false)
      setIsCancelDialogOpen(false)

      toast({
        title: "Order Cancelled",
        description: `Order #${selectedOrder.id} has been cancelled successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the order. Please try again or contact staff.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  // Show loading state while fetching data
  if (isLoading && !table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-500 p-3 rounded-full">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-900">Loading table information...</div>
          <div className="text-gray-600 mt-2">Please wait a moment</div>
        </div>
      </div>
    )
  }

  // Main table orders view
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-500 p-3 rounded-full">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Cafe Manager</h1>
          <p className="text-xl text-gray-700">{table ? table.name : `Table ${tableId}`}</p>
          <p className="text-gray-600">{table && `Capacity: ${table.capacity} seats`}</p>

          <div className="flex justify-center gap-4 mt-6">
            <Button onClick={goToMenu} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
              View Menu & Order
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Orders
            </Button>
          </div>
        </div>

        {/* Orders */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Table Orders</CardTitle>
            <CardDescription>View all orders placed for this table</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="text-muted-foreground">Loading orders...</div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-8">
                <div className="text-muted-foreground mb-4">No orders found for this table</div>
                <Button onClick={goToMenu} className="bg-orange-500 hover:bg-orange-600 text-white">
                  Place Your First Order
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current/Active Orders */}
                {orders.filter((order) => order.status !== "paid").length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Current Orders</h3>
                    <div className="space-y-4">
                      {orders
                        .filter((order) => order.status !== "paid")
                        .map((order) => (
                          <Card
                            key={order.id}
                            className="border-l-4 border-l-orange-500 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleViewOrder(order)}
                          >
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-semibold text-lg">Order #{order.id}</h4>
                                  <p className="text-sm text-muted-foreground">{formatDateTime(order.orderDate)}</p>
                                  <p className="text-sm font-medium mt-1">
                                    Ordered by: <span className="text-orange-600">{order.guestName || "Guest"}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(order.status)}
                                  <span className="font-bold text-lg">${order.total.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Order Items */}
                              <div className="space-y-3">
                                <h5 className="font-medium">Items:</h5>
                                <div className="space-y-2">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md"
                                    >
                                      <span className="font-medium">
                                        {item.productName} x{item.quantity}
                                      </span>
                                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Order History */}
                {orders.filter((order) => order.status === "paid").length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Order History</h3>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Order ID</TableHead>
                            <TableHead className="font-semibold">Guest</TableHead>
                            <TableHead className="font-semibold">Items</TableHead>
                            <TableHead className="font-semibold">Total</TableHead>
                            <TableHead className="font-semibold">Date/Time</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders
                            .filter((order) => order.status === "paid")
                            .map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>{order.guestName || "Guest"}</TableCell>
                                <TableCell>{order.items.length} items</TableCell>
                                <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                                <TableCell>{formatDateTime(order.orderDate)}</TableCell>
                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 bg-white/50 rounded-lg p-4">
          <p>Scan the QR code on your table to view real-time order updates</p>
          <p className="mt-1">Orders will appear here automatically as they are placed</p>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>{selectedOrder && formatDateTime(selectedOrder.orderDate)}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Guest: {selectedOrder.guestName || "Guest"}</p>
                  <p className="text-sm text-muted-foreground">Table {tableId}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedOrder.status)}
                  <span className="font-bold text-lg">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="border rounded-md">
                <div className="p-4 border-b bg-muted/50">
                  <h4 className="font-medium">Order Items</h4>
                </div>
                <div className="p-4 space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-sm text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="font-bold text-lg">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedOrder?.status === "new" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsOrderDetailsOpen(false)
                  setIsCancelDialogOpen(true)
                }}
                className="w-full sm:w-auto"
              >
                Cancel Order
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel Order #{selectedOrder?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will permanently remove the order and you'll need to place a new order if you change your mind.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isCancelling}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={isCancelling}>
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
