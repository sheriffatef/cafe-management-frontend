"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import useApi from "@/hooks/use-api"
import type { Product } from "@/lib/api"

interface ProductCardProps {
  product: Product
  onEdit: () => void
  onDelete: () => void
}

function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
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
      <CardFooter className="p-4 flex justify-between">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function ProductsPage() {
  const { toast } = useToast()
  const { isLoading, error, executeApiCall, api } = useApi()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<string>("all")
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false)

  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    imageUrl: "",
  })

  // Form state for editing product
  const [editProduct, setEditProduct] = useState({
    id: 0,
    name: "",
    description: "",
    price: 0,
    category: "",
    imageUrl: "",
  })

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

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isForNewProduct: boolean) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        const preview = reader.result as string
        setImagePreview(preview)

        // Update the form state with the preview URL
        if (isForNewProduct) {
          setNewProduct({ ...newProduct, imageUrl: preview })
        } else {
          setEditProduct({ ...editProduct, imageUrl: preview })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle creating a new product
  const handleCreateProduct = async () => {
    // Validate form
    if (!newProduct.name || !newProduct.category || newProduct.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and ensure price is greater than 0",
        variant: "destructive",
      })
      return
    }

    const result = await executeApiCall(() =>
      api.products.create({
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        category: newProduct.category,
        imageUrl: newProduct.imageUrl,
      }),
    )

    if (result) {
      // If we're viewing all products or the same category as the new product,
      // add it to the current list
      if (currentCategory === "all" || currentCategory === result.category) {
        setProducts([...products, result])
      }

      // Reset form and close dialog
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        category: "",
        imageUrl: "",
      })
      setImageFile(null)
      setImagePreview(null)
      setIsCreateDialogOpen(false)

      toast({
        title: "Success",
        description: "Product created successfully",
      })
    }
  }

  // Handle updating a product
  const handleUpdateProduct = async () => {
    // Validate form
    if (!editProduct.name || !editProduct.category || editProduct.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and ensure price is greater than 0",
        variant: "destructive",
      })
      return
    }

    const result = await executeApiCall(() =>
      api.products.update(editProduct.id, {
        name: editProduct.name,
        description: editProduct.description,
        price: editProduct.price,
        category: editProduct.category,
        imageUrl: editProduct.imageUrl,
      }),
    )

    if (result) {
      // If the category changed and we're viewing by category, we might need to refresh
      const categoryChanged = selectedProduct?.category !== result.category

      if (categoryChanged && currentCategory !== "all" && currentCategory !== result.category) {
        // Product no longer belongs in this category view, remove it
        setProducts(products.filter((p) => p.id !== result.id))
      } else {
        // Update the product in the list
        setProducts(products.map((product) => (product.id === result.id ? result : product)))
      }

      // Reset form and close dialog
      setEditProduct({
        id: 0,
        name: "",
        description: "",
        price: 0,
        category: "",
        imageUrl: "",
      })
      setSelectedProduct(null)
      setImageFile(null)
      setImagePreview(null)
      setIsEditDialogOpen(false)

      toast({
        title: "Success",
        description: "Product updated successfully",
      })
    }
  }

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return

    await executeApiCall(() => api.products.delete(selectedProduct.id))

    // Remove the product from the list
    setProducts(products.filter((product) => product.id !== selectedProduct.id))

    // Reset selected product and close dialog
    setSelectedProduct(null)
    setIsDeleteDialogOpen(false)

    toast({
      title: "Success",
      description: "Product deleted successfully",
    })
  }

  // Open edit dialog for a product
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setEditProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
    })
    setImagePreview(product.imageUrl)
    setIsEditDialogOpen(true)
  }

  // Open delete confirmation dialog for a product
  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Add New Product</Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="coffee">Coffee</TabsTrigger>
          <TabsTrigger value="pastry">Pastry</TabsTrigger>
          <TabsTrigger value="dessert">Dessert</TabsTrigger>
          <TabsTrigger value="food">Food</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No products found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => openEditDialog(product)}
                  onDelete={() => openDeleteDialog(product)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {["coffee", "pastry", "dessert", "food"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {categoryLoading || isLoading ? (
              <div className="flex justify-center p-8">Loading {category} products...</div>
            ) : products.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">No {category} products found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => openEditDialog(product)}
                    onDelete={() => openDeleteDialog(product)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a new product for your menu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-name"
                placeholder="Product name"
                className="col-span-3"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="new-description"
                placeholder="Product description"
                className="col-span-3"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-price" className="text-right">
                Price
              </Label>
              <Input
                id="new-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="col-span-3"
                value={newProduct.price || ""}
                onChange={(e) => setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-category" className="text-right">
                Category
              </Label>
              <Select
                value={newProduct.category}
                onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coffee">Coffee</SelectItem>
                  <SelectItem value="pastry">Pastry</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-image" className="text-right">
                Image
              </Label>
              <div className="col-span-3">
                <Input id="new-image" type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Product preview"
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateProduct} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                placeholder="Product name"
                className="col-span-3"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Product description"
                className="col-span-3"
                value={editProduct.description}
                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price
              </Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="col-span-3"
                value={editProduct.price || ""}
                onChange={(e) => setEditProduct({ ...editProduct, price: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Select
                value={editProduct.category}
                onValueChange={(value) => setEditProduct({ ...editProduct, category: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coffee">Coffee</SelectItem>
                  <SelectItem value="pastry">Pastry</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-image" className="text-right">
                Image
              </Label>
              <div className="col-span-3">
                <Input id="edit-image" type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Product preview"
                      className="h-20 w-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleUpdateProduct} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProduct?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteProduct} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
