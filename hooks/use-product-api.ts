"use client"

import { useState, useEffect } from "react"
import useApi from "./use-api"
import type { Product } from "@/lib/api"

/**
 * Custom hook for managing products with the API
 * @returns Object with products, loading state, error state, and product management methods
 */
export function useProductApi() {
  const { isLoading, error, executeApiCall, api } = useApi()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  // Load products on hook initialization
  useEffect(() => {
    loadProducts()
  }, [])

  // Filter products when category changes
  useEffect(() => {
    if (currentCategory) {
      setFilteredProducts(products.filter((product) => product.category === currentCategory))
    } else {
      setFilteredProducts(products)
    }
  }, [products, currentCategory])

  /**
   * Load all products from API
   */
  const loadProducts = async () => {
    const result = await executeApiCall(() => api.products.getAll())
    if (result) {
      setProducts(result)
    }
  }

  /**
   * Load products by category
   * @param category - Product category to filter by
   */
  const loadProductsByCategory = async (category: string) => {
    setCurrentCategory(category)
    const result = await executeApiCall(() => api.products.getByCategory(category))
    if (result) {
      // Update filtered products but keep the full product list intact
      setFilteredProducts(result)
    }
  }

  /**
   * Create a new product
   * @param productData - New product data
   * @returns Created product if successful, null otherwise
   */
  const createProduct = async (productData: {
    name: string
    description: string
    price: number
    category: string
    imageUrl?: string
  }) => {
    const result = await executeApiCall(() => api.products.create(productData))
    if (result) {
      setProducts([...products, result])
      return result
    }
    return null
  }

  /**
   * Update an existing product
   * @param id - Product ID
   * @param productData - Updated product data
   * @returns Updated product if successful, null otherwise
   */
  const updateProduct = async (
    id: number,
    productData: Partial<{
      name: string
      description: string
      price: number
      category: string
      imageUrl: string
    }>,
  ) => {
    const result = await executeApiCall(() => api.products.update(id, productData))
    if (result) {
      setProducts(products.map((product) => (product.id === id ? result : product)))
      return result
    }
    return null
  }

  /**
   * Delete a product
   * @param id - Product ID
   * @returns True if successful, false otherwise
   */
  const deleteProduct = async (id: number) => {
    const success = await executeApiCall(async () => {
      await api.products.delete(id)
      return true
    })

    if (success) {
      setProducts(products.filter((product) => product.id !== id))
      return true
    }
    return false
  }

  /**
   * Get a product by ID
   * @param id - Product ID
   * @returns Product if found, null otherwise
   */
  const getProductById = (id: number) => {
    return products.find((product) => product.id === id) || null
  }

  /**
   * Reset category filter to show all products
   */
  const resetCategoryFilter = () => {
    setCurrentCategory(null)
    setFilteredProducts(products)
  }

  return {
    products: filteredProducts,
    allProducts: products,
    isLoading,
    error,
    loadProducts,
    loadProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    resetCategoryFilter,
    currentCategory,
  }
}

export default useProductApi
