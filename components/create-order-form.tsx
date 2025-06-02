"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Product, Table } from "@/lib/api"

interface CreateOrderFormProps {
  tables: Table[]
  products: Product[]
  onSubmit: (data: { tableId: number; items: { productId: number; quantity: number }[] }) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function CreateOrderForm({ tables, products, onSubmit, onCancel, isLoading }: CreateOrderFormProps) {
  const [tableId, setTableId] = useState<number>(0)
  const [items, setItems] = useState<{ productId: number; quantity: number }[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [errors, setErrors] = useState<{ tableId?: string; items?: string }>({})

  // Add product to order
  const handleAddProduct = () => {
    if (!selectedProduct || selectedQuantity <= 0) return

    // Check if product already exists in the order
    const existingItemIndex = items.findIndex((item) => item.productId === selectedProduct)

    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity += selectedQuantity
      setItems(updatedItems)
    } else {
      // Add new product to order
      setItems([...items, { productId: selectedProduct, quantity: selectedQuantity }])
    }

    // Clear any errors
    if (errors.items) {
      setErrors({ ...errors, items: undefined })
    }

    // Reset selection
    setSelectedProduct(null)
    setSelectedQuantity(1)
  }

  // Remove product from order
  const handleRemoveProduct = (productId: number) => {
    setItems(items.filter((item) => item.productId !== productId))
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

  // Calculate subtotal for order
  const calculateSubtotal = (): number => {
    return items.reduce((total, item) => {
      const price = getProductPrice(item.productId)
      return total + price * item.quantity
    }, 0)
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const newErrors: { tableId?: string; items?: string } = {}

    if (tableId === 0) {
      newErrors.tableId = "Please select a table"
    }

    if (items.length === 0) {
      newErrors.items = "Please add at least one item"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    await onSubmit({ tableId, items })
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="table" className="text-right">
          Table
        </Label>
        <div className="col-span-3 space-y-1">
          <Select value={tableId ? tableId.toString() : undefined} onValueChange={(value) => setTableId(Number(value))}>
            <SelectTrigger className={errors.tableId ? "border-red-500" : ""}>
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
          {errors.tableId && <p className="text-xs text-red-500">{errors.tableId}</p>}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Items</Label>
        <div className={`border rounded-md p-4 ${errors.items ? "border-red-500" : ""}`}>
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="product" className="mb-2">
                  Product
                </Label>
                <Select
                  value={selectedProduct?.toString()}
                  onValueChange={(value) => setSelectedProduct(Number(value))}
                >
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
              <Button onClick={handleAddProduct} disabled={!selectedProduct || selectedQuantity < 1}>
                Add
              </Button>
            </div>
          </div>
          <div className="mt-4">
            {items.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground">No items added yet</p>
                {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
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
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(item.productId)}>
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </div>
  )
}
