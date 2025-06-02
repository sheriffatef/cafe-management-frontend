"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Product } from "@/lib/api"

interface ProductFormProps {
  initialData?: Partial<Product>
  onSubmit: (data: Partial<Product>, imageFile?: File | null) => Promise<void>
  onCancel: () => void
  isLoading: boolean
  submitLabel: string
}

export function ProductForm({ initialData = {}, onSubmit, onCancel, isLoading, submitLabel }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    imageUrl: "",
    ...initialData,
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Set image preview if initialData has an imageUrl
  useEffect(() => {
    if (initialData?.imageUrl) {
      setImagePreview(initialData.imageUrl)
    }
  }, [initialData])

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  // Handle price field changes (convert to number)
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value) || 0
    setFormData({ ...formData, price: value })

    // Clear error for this field
    if (errors.price) {
      setErrors({ ...errors, price: "" })
    }
  }

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category: value })

    // Clear error for this field
    if (errors.category) {
      setErrors({ ...errors, category: "" })
    }
  }

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        const preview = reader.result as string
        setImagePreview(preview)
      }
      reader.readAsDataURL(file)
    }
  }

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Price must be greater than 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      await onSubmit(formData, imageFile)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id="name"
            name="name"
            placeholder="Product name"
            value={formData.name || ""}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Product description"
          className="col-span-3"
          value={formData.description || ""}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="price" className="text-right">
          Price
        </Label>
        <div className="col-span-3 space-y-1">
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.price || ""}
            onChange={handlePriceChange}
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="category" className="text-right">
          Category
        </Label>
        <div className="col-span-3 space-y-1">
          <Select value={formData.category || ""} onValueChange={handleCategoryChange}>
            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coffee">Coffee</SelectItem>
              <SelectItem value="pastry">Pastry</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
              <SelectItem value="food">Food</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="text-right">
          Image
        </Label>
        <div className="col-span-3">
          <Input id="image" name="image" type="file" accept="image/*" onChange={handleImageChange} />
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
