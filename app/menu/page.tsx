"use client"
export const dynamic = "force-dynamic" // ⬅️ أضف هذا السطر

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Coffee, ShoppingCart, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import useApi from "@/hooks/use-api"
import type { Product } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CartItem extends Product {
  quantity: number
}

export default function MenuPage() {
  const { toast } = useToast()
  const router = useRouter()
  // const searchParams = useSearchParams()
  const { isLoading, error, executeApiCall, api } = useApi()

  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<string>("all")
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [cartCustomerName, setCartCustomerName] = useState<string>("")

  // Get table and customer from URL parameters
  useEffect(() => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    const tableParam = params.get("table")
    if (tableParam) {
      setSelectedTable(tableParam)
    }
  }
}, [])

  // Load products on component mount
  useEffect(() => {
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

  // Load all products from API
  const loadProducts = async () => {
    const result = await executeApiCall(() => api.products.getAll())
    if (result) {
      setProducts(result)
    }
  }

  // Load products by category
  const loadProductsByCategory = async (category: string) => {
    setCurrentCategory(category)

    if (category === "all") {
      await loadProducts()
      return
    }

    setCategoryLoading(true)
    try {
      const result = await executeApiCall(() => api.products.getByCategory(category))
      if (result) {
        setProducts(result)
      }
    } finally {
      setCategoryLoading(false)
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    loadProductsByCategory(value)
  }

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId)
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
      } else {
        return prevCart.filter((item) => item.id !== productId)
      }
    })
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (!selectedTable || cart.length === 0) {
      toast({
        title: "Cannot place order",
        description: "Please ensure you have items in your cart and a table selected",
        variant: "destructive",
      })
      return
    }

    if (!cartCustomerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before placing the order",
        variant: "destructive",
      })
      return
    }

    setIsPlacingOrder(true)

    try {
      // Create order items from cart
      const orderItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }))

      console.log("Placing order for table:", selectedTable)
      console.log("Customer name:", cartCustomerName.trim())
      console.log("Order items:", orderItems)

      // Create order with guest name
      const result = await executeApiCall(() =>
        api.orders.create({
          tableId: Number.parseInt(selectedTable),
          guestName: cartCustomerName.trim(),
          items: orderItems,
        }),
      )

      console.log("Order result:", result)

      // Always reset cart and redirect, regardless of API response
      setCart([])
      setCartCustomerName("")
      setIsCartOpen(false)

      if (result) {
        toast({
          title: "Order Placed Successfully!",
          description: `Thank you ${cartCustomerName.trim()}! Your order has been placed for Table ${selectedTable}`,
        })
      } else {
        toast({
          title: "Order Submitted",
          description: "Your order has been submitted. Please check with staff if you don't see it appear shortly.",
          variant: "destructive",
        })
      }

      // Always redirect back to table orders page
      setTimeout(() => {
        router.push(`/table-orders/${selectedTable}`)
      }, 1000)
    } catch (error) {
      console.error("Error placing order:", error)

      // Still reset cart and redirect even on error
      setCart([])
      setCartCustomerName("")
      setIsCartOpen(false)

      toast({
        title: "Order Submission Error",
        description: "There was an issue submitting your order. Please try again or contact staff.",
        variant: "destructive",
      })

      setTimeout(() => {
        router.push(`/table-orders/${selectedTable}`)
      }, 2000)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const goBackToTable = () => {
    if (selectedTable) {
      router.push(`/table-orders/${selectedTable}`)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {selectedTable && (
            <Button variant="ghost" size="icon" onClick={goBackToTable} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Link href="/" className="flex items-center space-x-2">
            <Coffee className="h-6 w-6" />
            <span className="font-bold">Cafe Manager</span>
          </Link>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="outline" size="icon" onClick={() => setIsCartOpen(true)} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5 flex items-center justify-center">
                  {getTotalItems()}
                </Badge>
              )}
              <span className="sr-only">Open cart</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">Our Menu</h1>

          {isLoading && !categoryLoading ? (
            <div className="flex justify-center p-8">Loading menu...</div>
          ) : (
            <Tabs defaultValue="all" className="space-y-6" onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="coffee">Coffee</TabsTrigger>
                <TabsTrigger value="pastry">Pastry</TabsTrigger>
                <TabsTrigger value="dessert">Dessert</TabsTrigger>
                <TabsTrigger value="food">Food</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {products.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">No products available</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <MenuProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {["coffee", "pastry", "dessert", "food"].map((category) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  {categoryLoading ? (
                    <div className="flex justify-center p-8">Loading {category} products...</div>
                  ) : products.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">No {category} products available</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <MenuProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </main>

      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Your Order</DialogTitle>
            <DialogDescription>Review your order {selectedTable && `for Table ${selectedTable}`}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.imageUrl || "/placeholder.svg?height=100&width=100"}
                          alt={item.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                          disabled={isPlacingOrder}
                        >
                          -
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => addToCart(item)}
                          disabled={isPlacingOrder}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between font-bold text-lg pt-4 border-t">
                  <span>Total:</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                {selectedTable && (
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Order for: </span>
                      <span className="font-medium">Table {selectedTable}</span>
                    </div>
                  </div>
                )}
                {cart.length > 0 && (
                  <div className="pt-4 border-t">
                    <Label htmlFor="customer-name" className="text-sm font-medium">
                      Your Name *
                    </Label>
                    <Input
                      id="customer-name"
                      type="text"
                      placeholder="Enter your name"
                      value={cartCustomerName}
                      onChange={(e) => setCartCustomerName(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !selectedTable || isPlacingOrder || !cartCustomerName.trim()}
              className="w-full"
            >
              {isPlacingOrder ? "Placing Order..." : "Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Menu Product Card Component
interface MenuProductCardProps {
  product: Product
  onAddToCart: () => void
}

function MenuProductCard({ product, onAddToCart }: MenuProductCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-4">
          <img
            src={product.imageUrl || "/placeholder.svg?height=100&width=100"}
            alt={product.name}
            className="h-16 w-16 rounded-md object-cover"
          />
          <div>
            <CardTitle>{product.name}</CardTitle>
            <div className="text-sm text-muted-foreground capitalize">{product.category}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-2 text-lg font-bold">${product.price.toFixed(2)}</div>
      </CardContent>
      <CardFooter className="p-4">
        <Button className="w-full" onClick={onAddToCart}>
          Add to Order
        </Button>
      </CardFooter>
    </Card>
  )
}
