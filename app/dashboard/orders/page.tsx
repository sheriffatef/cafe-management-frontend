"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import useApi from "@/hooks/use-api"
import type { Order, Product, Table as TableType, OrderItem } from "@/lib/api"

export default function OrdersPage() {
  const { toast } = useToast()
  const { isLoading, error, executeApiCall, api } = useApi()
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<TableType[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>("all")
  const [statusLoading, setStatusLoading] = useState<boolean>(false)

  const [selectedTableFilter, setSelectedTableFilter] = useState<number | null>(null)
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])

  // New order form state
  const [newOrder, setNewOrder] = useState({
    tableId: 0,
    guestName: "",
    items: [] as { productId: number; quantity: number }[],
  })
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

  // Load orders, tables, and products on component mount
  useEffect(() => {
    loadOrders()
    loadTables()
    loadProducts()
  }, [])

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

  // Load all orders from API
  const loadOrders = async () => {
    const result = await executeApiCall(() => api.orders.getAll())
    if (result) {
      setOrders(result)
    }
  }

  // Load orders by status
  const loadOrdersByStatus = async (status: string) => {
    setCurrentStatus(status)

    if (status === "all") {
      await loadOrders()
      return
    }

    setStatusLoading(true)
    try {
      const result = await executeApiCall(() => api.orders.getByStatus(status as any))
      if (result) {
        setOrders(result)
      }
    } finally {
      setStatusLoading(false)
    }
  }

  // Load all tables from API
  const loadTables = async () => {
    const result = await executeApiCall(() => api.tables.getAll())
    if (result) {
      setTables(result)
    }
  }

  // Load all products from API
  const loadProducts = async () => {
    const result = await executeApiCall(() => api.products.getAll())
    if (result) {
      setProducts(result)
    }
  }

  // Filter orders by selected table
  useEffect(() => {
    if (selectedTableFilter === null) {
      // Show all orders when no specific table is selected
      setFilteredOrders(orders)
    } else {
      // Filter by selected table
      setFilteredOrders(orders.filter((order) => order.tableId === selectedTableFilter))
    }
  }, [orders, selectedTableFilter])

  // Handle tab change
  const handleTabChange = (value: string) => {
    loadOrdersByStatus(value)
  }

  // Handle viewing order details
  const handleViewOrder = async (order: Order) => {
    // Get the full order details with the API
    const result = await executeApiCall(() => api.orders.getById(order.id))
    if (result) {
      setSelectedOrder(result)
      setIsOrderDetailsOpen(true)
    }
  }

  // Handle updating order status
  const handleUpdateStatus = async (
    orderId: number,
    newStatus: "new" | "preparing" | "ready" | "delivered" | "paid",
  ) => {
    const result = await executeApiCall(() => api.orders.updateStatus(orderId, newStatus))

    if (result) {
      // Update the order in the list
      setOrders(orders.map((order) => (order.id === orderId ? result : order)))

      // If we're viewing by status and the status changed, we might need to refresh
      if (currentStatus !== "all" && currentStatus !== newStatus) {
        // Order no longer belongs in this status view, remove it
        setOrders(orders.filter((order) => order.id !== orderId))
      }

      // Update the selected order if it's open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(result)
      }

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
    }
  }

  // Handle deleting an order
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return

    await executeApiCall(() => api.orders.delete(selectedOrder.id))

    // Remove the order from the list
    setOrders(orders.filter((order) => order.id !== selectedOrder.id))

    // Reset selected order and close dialogs
    setSelectedOrder(null)
    setIsOrderDetailsOpen(false)
    setIsDeleteDialogOpen(false)

    toast({
      title: "Success",
      description: "Order deleted successfully",
    })
  }

  // Add product to new order
  const handleAddProductToOrder = () => {
    if (!selectedProduct || selectedQuantity <= 0) return

    // Check if product already exists in the order
    const existingItemIndex = newOrder.items.findIndex((item) => item.productId === selectedProduct)

    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...newOrder.items]
      updatedItems[existingItemIndex].quantity += selectedQuantity
      setNewOrder({ ...newOrder, items: updatedItems })
    } else {
      // Add new product to order
      setNewOrder({
        ...newOrder,
        items: [...newOrder.items, { productId: selectedProduct, quantity: selectedQuantity }],
      })
    }

    // Reset selection
    setSelectedProduct(null)
    setSelectedQuantity(1)
  }

  // Remove product from new order
  const handleRemoveProductFromOrder = (productId: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((item) => item.productId !== productId),
    })
  }

  // Create new order
  const handleCreateOrder = async () => {
    if (newOrder.tableId === 0 || newOrder.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a table and add at least one item",
        variant: "destructive",
      })
      return
    }

    const result = await executeApiCall(() => api.orders.create(newOrder))

    if (result) {
      // Add the new order to the list if we're viewing all orders or new orders
      if (currentStatus === "all" || currentStatus === "new") {
        setOrders([result, ...orders])
      }

      // Reset form and close dialog
      setNewOrder({
        tableId: 0,
        guestName: "",
        items: [],
      })
      setIsCreateOrderOpen(false)

      toast({
        title: "Success",
        description: "Order created successfully",
      })
    }
  }

  // Add item to existing order
  const handleAddItemToOrder = async (orderId: number, productId: number, quantity: number) => {
    const result = await executeApiCall(() => api.orders.addItem(orderId, { productId, quantity }))

    if (result && selectedOrder) {
      // Refresh the order details
      const updatedOrder = await executeApiCall(() => api.orders.getById(orderId))
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)

        // Also update in the orders list
        setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)))

        toast({
          title: "Success",
          description: "Item added to order",
        })
      }
    }
  }

  // Update item quantity in existing order
  const handleUpdateItemQuantity = async (orderId: number, itemId: number, quantity: number) => {
    const result = await executeApiCall(() => api.orders.updateItem(orderId, itemId, quantity))

    if (result && selectedOrder) {
      // Refresh the order details
      const updatedOrder = await executeApiCall(() => api.orders.getById(orderId))
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)

        // Also update in the orders list
        setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)))

        toast({
          title: "Success",
          description: "Item quantity updated",
        })
      }
    }
  }

  // Remove item from existing order
  const handleRemoveItem = async (orderId: number, itemId: number) => {
    await executeApiCall(() => api.orders.removeItem(orderId, itemId))

    if (selectedOrder) {
      // Refresh the order details
      const updatedOrder = await executeApiCall(() => api.orders.getById(orderId))
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)

        // Also update in the orders list
        setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)))

        toast({
          title: "Success",
          description: "Item removed from order",
        })
      }
    }
  }

  // Get product name by ID
  const getProductName = (productId: number): string => {
    const product = products.find((p) => p.id === productId)
    return product ? product.name : `Product #${productId}`
  }

  // Get product price by ID
  const getProductPrice = (productId: number): number => {
    const product = products.find((p) => p.id === productId)
    return product ? product.price : 0
  }

  // Calculate subtotal for new order
  const calculateSubtotal = (): number => {
    return newOrder.items.reduce((total, item) => {
      const price = getProductPrice(item.productId)
      return total + price * item.quantity
    }, 0)
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

  // Handle quick status update
  const handleQuickStatusUpdate = async (orderId: number, currentStatus: string) => {
    let newStatus: "preparing" | "ready" | "delivered" | "paid"

    switch (currentStatus) {
      case "new":
        newStatus = "preparing"
        break
      case "preparing":
        newStatus = "ready"
        break
      case "ready":
        newStatus = "delivered"
        break
      case "delivered":
        newStatus = "paid"
        break
      default:
        return
    }

    const result = await executeApiCall(() => api.orders.updateStatus(orderId, newStatus))

    if (result) {
      setOrders(orders.map((order) => (order.id === orderId ? result : order)))

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="table-filter">Filter by Table:</Label>
            <Select
              value={selectedTableFilter?.toString() || "all"}
              onValueChange={(value) => setSelectedTableFilter(value === "all" ? null : Number(value))}
            >
              <SelectTrigger className="w-[180px]" id="table-filter">
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsCreateOrderOpen(true)}>Create New Order</Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Manage your cafe orders</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No orders found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: Order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleQuickStatusUpdate(order.id, order.status)}
                      >
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>Table {order.tableId}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell>${order.total.toFixed(2)}</TableCell>
                        <TableCell>{formatDateTime(order.orderDate)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2">
                            {order.status !== "paid" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuickStatusUpdate(order.id, order.status)
                                  }}
                                >
                                  {order.status === "new" && "Start Preparing"}
                                  {order.status === "preparing" && "Mark Ready"}
                                  {order.status === "ready" && "Mark Delivered"}
                                  {order.status === "delivered" && "Mark Paid"}
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUpdateStatus(order.id, "paid")
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Mark as Paid
                                </Button>
                              </>
                            )}
                            {order.status === "paid" && <Badge className="bg-green-600">Paid</Badge>}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewOrder(order)
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {["new", "preparing", "ready", "delivered", "paid"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{status} Orders</CardTitle>
                <CardDescription>Manage your {status} orders</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading || isLoading ? (
                  <div className="flex justify-center p-8">Loading {status} orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">No {status} orders found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order: Order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleQuickStatusUpdate(order.id, order.status)}
                        >
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>Table {order.tableId}</TableCell>
                          <TableCell>{order.items.length} items</TableCell>
                          <TableCell>${order.total.toFixed(2)}</TableCell>
                          <TableCell>{formatDateTime(order.orderDate)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2">
                              {order.status !== "paid" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleQuickStatusUpdate(order.id, order.status)
                                    }}
                                  >
                                    {order.status === "new" && "Start Preparing"}
                                    {order.status === "preparing" && "Mark Ready"}
                                    {order.status === "ready" && "Mark Delivered"}
                                    {order.status === "delivered" && "Mark Paid"}
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(order.id, "paid")
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Mark as Paid
                                  </Button>
                                </>
                              )}
                              {order.status === "paid" && <Badge className="bg-green-600">Paid</Badge>}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewOrder(order)
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Table {selectedOrder?.tableId} • {selectedOrder && formatDateTime(selectedOrder.orderDate)}
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">
            Guest: <strong>{selectedOrder?.guestName}</strong>
          </p>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Status</h3>
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </div>

            {/* Order Items Table */}
            <div className="border rounded-md">
              <div className="p-4 border-b bg-muted/50">
                <h4 className="font-medium">Order Items</h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    {selectedOrder?.status === "new" && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder?.items.map((item: OrderItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      {selectedOrder.status === "new" && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(selectedOrder.id, item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={selectedOrder?.status === "new" ? 3 : 3} className="text-right font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">${selectedOrder?.total.toFixed(2)}</TableCell>
                    {selectedOrder?.status === "new" && <TableCell></TableCell>}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Add item to order (only for new orders) */}
            {selectedOrder?.status === "new" && (
              <div className="border rounded-md p-4 bg-muted/20">
                <h3 className="font-medium mb-3">Add Item to Order</h3>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor="add-product" className="text-sm font-medium">
                      Product
                    </Label>
                    <Select onValueChange={(value) => setSelectedProduct(Number(value))}>
                      <SelectTrigger id="add-product" className="mt-1">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - ${product.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Label htmlFor="add-quantity" className="text-sm font-medium">
                      Qty
                    </Label>
                    <Input
                      id="add-quantity"
                      type="number"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() =>
                      selectedOrder &&
                      selectedProduct &&
                      handleAddItemToOrder(selectedOrder.id, selectedProduct, selectedQuantity)
                    }
                    disabled={!selectedProduct || selectedQuantity < 1}
                    className="mb-0"
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            {/* Status Update Buttons */}
            {selectedOrder?.status === "new" && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, "preparing")}
                disabled={isLoading}
              >
                Start Preparing
              </Button>
            )}
            {selectedOrder?.status === "preparing" && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, "ready")}
                disabled={isLoading}
              >
                Mark as Ready
              </Button>
            )}
            {selectedOrder?.status === "ready" && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, "delivered")}
                disabled={isLoading}
              >
                Mark as Delivered
              </Button>
            )}
            {selectedOrder?.status === "delivered" && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, "paid")}
                disabled={isLoading}
              >
                Mark as Paid
              </Button>
            )}

            {/* Cancel Order Button - only for new orders */}
            {selectedOrder?.status === "new" && (
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  setIsOrderDetailsOpen(false)
                  setIsDeleteDialogOpen(true)
                }}
                disabled={isLoading}
              >
                Cancel Order
              </Button>
            )}

            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsOrderDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Create a new order for a table</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Guest Name Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="guestName" className="text-right">
                Guest Name
              </Label>
              <Input
                id="guestName"
                className="col-span-3"
                value={newOrder.guestName}
                onChange={(e) => setNewOrder({ ...newOrder, guestName: e.target.value })}
                placeholder="Enter guest name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table" className="text-right">
                Table
              </Label>
              <Select
                value={newOrder.tableId ? newOrder.tableId.toString() : undefined}
                onValueChange={(value) => setNewOrder({ ...newOrder, tableId: Number(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables
                    .filter((table) => table.status === "available")
                    .map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.name} (Capacity: {table.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Items</Label>
              <div className="border rounded-md p-4">
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="product" className="mb-2">
                        Product
                      </Label>
                      <Select onValueChange={(value) => setSelectedProduct(Number(value))}>
                        <SelectTrigger id="product">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ${product.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label htmlFor="quantity" className="mb-2">
                        Qty
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                      />
                    </div>
                    <Button onClick={handleAddProductToOrder} disabled={!selectedProduct || selectedQuantity < 1}>
                      Add
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  {newOrder.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {newOrder.items.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{getProductName(item.productId)}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ${getProductPrice(item.productId).toFixed(2)} x {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-4">
                              ${(getProductPrice(item.productId) * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProductFromOrder(item.productId)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold">${calculateSubtotal().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOrderOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleCreateOrder}
              disabled={isLoading || newOrder.tableId === 0 || newOrder.items.length === 0}
            >
              {isLoading ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel Order #{selectedOrder?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Keep Order
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteOrder} disabled={isLoading}>
              {isLoading ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
