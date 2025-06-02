"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Order, Product } from "@/lib/api"

interface OrderDetailsProps {
  order: Order
  products: Product[]
  onUpdateStatus: (orderId: number, status: string) => Promise<void>
  onAddItem?: (orderId: number, productId: number, quantity: number) => Promise<void>
  onRemoveItem?: (orderId: number, itemId: number) => Promise<void>
  onClose: () => void
  onDelete?: () => void
}

export function OrderDetails({
  order,
  products,
  onUpdateStatus,
  onAddItem,
  onRemoveItem,
  onClose,
  onDelete,
}: OrderDetailsProps) {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

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

  // Get next status based on current status
  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case "new":
        return "preparing"
      case "preparing":
        return "ready"
      case "ready":
        return "delivered"
      case "delivered":
        return "paid"
      default:
        return null
    }
  }

  // Get next status button label
  const getNextStatusLabel = (currentStatus: string): string => {
    switch (currentStatus) {
      case "new":
        return "Start Preparing"
      case "preparing":
        return "Mark as Ready"
      case "ready":
        return "Mark as Delivered"
      case "delivered":
        return "Mark as Paid"
      default:
        return "Update Status"
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.id}</h3>
          <p className="text-sm text-muted-foreground">
            Table {order.tableId} • {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div>{getStatusBadge(order.status)}</div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.productName}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                <TableCell>
                  {order.status === "new" && onRemoveItem && (
                    <Button variant="ghost" size="sm" onClick={() => onRemoveItem(order.id, item.id)}>
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Total
              </TableCell>
              <TableCell className="text-right font-bold">${order.total.toFixed(2)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Add item to order (only for new orders) */}
      {order.status === "new" && onAddItem && (
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Add Item</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="add-product" className="mb-2">
                Product
              </Label>
              <Select onValueChange={(value) => setSelectedProduct(Number(value))}>
                <SelectTrigger id="add-product">
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
              <Label htmlFor="add-quantity" className="mb-2">
                Qty
              </Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Number(e.target.value))}
              />
            </div>
            <Button
              onClick={() => selectedProduct && onAddItem(order.id, selectedProduct, selectedQuantity)}
              disabled={!selectedProduct || selectedQuantity < 1}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
        {getNextStatus(order.status) && (
          <Button className="w-full sm:w-auto" onClick={() => onUpdateStatus(order.id, getNextStatus(order.status)!)}>
            {getNextStatusLabel(order.status)}
          </Button>
        )}
        {order.status === "new" && onDelete && (
          <Button variant="destructive" className="w-full sm:w-auto" onClick={onDelete}>
            Delete Order
          </Button>
        )}
        <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
