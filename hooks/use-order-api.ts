"use client"

import { useState, useEffect } from "react"
import useApi from "./use-api"
import type { Order } from "@/lib/api"

/**
 * Custom hook for managing orders with the API
 * @returns Object with orders, loading state, error state, and order management methods
 */
export function useOrderApi() {
  const { isLoading, error, executeApiCall, api } = useApi()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)

  // Load orders on hook initialization
  useEffect(() => {
    loadOrders()
  }, [])

  // Filter orders when status changes
  useEffect(() => {
    if (currentStatus) {
      setFilteredOrders(orders.filter((order) => order.status === currentStatus))
    } else {
      setFilteredOrders(orders)
    }
  }, [orders, currentStatus])

  /**
   * Load all orders from API
   */
  const loadOrders = async (): Promise<void> => {
    const result = await executeApiCall(() => api.orders.getAll())
    if (result) {
      setOrders(result)
    }
  }

  /**
   * Load orders by status
   * @param status - Order status to filter by
   */
  const loadOrdersByStatus = async (status: "new" | "preparing" | "ready" | "delivered" | "paid"): Promise<void> => {
    setCurrentStatus(status)
    const result = await executeApiCall(() => api.orders.getByStatus(status))
    if (result) {
      setFilteredOrders(result)
    }
  }

  /**
   * Load orders by table
   * @param tableId - Table ID to filter by
   */
  const loadOrdersByTable = async (tableId: number): Promise<void> => {
    const result = await executeApiCall(() => api.orders.getByTable(tableId))
    if (result) {
      setFilteredOrders(result)
    }
  }

  /**
   * Get order by ID
   * @param id - Order ID
   * @returns Order if found, null otherwise
   */
  const getOrderById = async (id: number): Promise<Order | null> => {
    const result = await executeApiCall(() => api.orders.getById(id))
    return result || null
  }

  /**
   * Create a new order
   * @param orderData - New order data
   * @returns Created order if successful, null otherwise
   */
  const createOrder = async (orderData: {
    tableId: number
    items: { productId: number; quantity: number }[]
  }): Promise<Order | null> => {
    const result = await executeApiCall(() => api.orders.create(orderData))
    if (result) {
      setOrders([...orders, result])
      return result
    }
    return null
  }

  /**
   * Update order status
   * @param id - Order ID
   * @param status - New status
   * @returns Updated order if successful, null otherwise
   */
  const updateOrderStatus = async (
    id: number,
    status: "new" | "preparing" | "ready" | "delivered" | "paid",
  ): Promise<Order | null> => {
    const result = await executeApiCall(() => api.orders.updateStatus(id, status))
    if (result) {
      setOrders(orders.map((order) => (order.id === id ? result : order)))
      return result
    }
    return null
  }

  /**
   * Delete an order
   * @param id - Order ID
   * @returns True if successful, false otherwise
   */
  const deleteOrder = async (id: number): Promise<boolean> => {
    const success = await executeApiCall(async () => {
      await api.orders.delete(id)
      return true
    })

    if (success) {
      setOrders(orders.filter((order) => order.id !== id))
      return true
    }
    return false
  }

  /**
   * Add item to order
   * @param orderId - Order ID
   * @param item - Item to add
   * @returns Added item if successful, null otherwise
   */
  const addItemToOrder = async (
    orderId: number,
    item: { productId: number; quantity: number },
  ): Promise<any | null> => {
    const result = await executeApiCall(() => api.orders.addItem(orderId, item))
    if (result) {
      // Refresh the order to get updated total
      const updatedOrder = await getOrderById(orderId)
      if (updatedOrder) {
        setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)))
      }
      return result
    }
    return null
  }

  /**
   * Update order item
   * @param orderId - Order ID
   * @param itemId - Item ID
   * @param quantity - New quantity
   * @returns Updated item if successful, null otherwise
   */
  const updateOrderItem = async (orderId: number, itemId: number, quantity: number): Promise<any | null> => {
    const result = await executeApiCall(() => api.orders.updateItem(orderId, itemId, quantity))
    if (result) {
      // Refresh the order to get updated total
      const updatedOrder = await getOrderById(orderId)
      if (updatedOrder) {
        setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)))
      }
      return result
    }
    return null
  }

  /**
   * Remove item from order
   * @param orderId - Order ID
   * @param itemId - Item ID
   * @returns True if successful, false otherwise
   */
  const removeOrderItem = async (orderId: number, itemId: number): Promise<boolean> => {
    const success = await executeApiCall(async () => {
      await api.orders.removeItem(orderId, itemId)
      return true
    })

    if (success) {
      // Refresh the order to get updated total
      const updatedOrder = await getOrderById(orderId)
      if (updatedOrder) {
        setOrders(orders.map((order) => (order.id === orderId ? updatedOrder : order)))
      }
      return true
    }
    return false
  }

  /**
   * Get current order for table
   * @param tableId - Table ID
   * @returns Current order if found, null otherwise
   */
  const getCurrentOrderForTable = async (tableId: number): Promise<Order | null> => {
    try {
      const result = await executeApiCall(() => api.orders.getByTable(tableId))
      if (result && result.length > 0) {
        // Find the most recent active order (not paid)
        const activeOrder = result.find((order) => order.status !== "paid")
        return activeOrder || null
      }
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Reset status filter to show all orders
   */
  const resetStatusFilter = (): void => {
    setCurrentStatus(null)
    setFilteredOrders(orders)
  }

  return {
    orders: filteredOrders,
    allOrders: orders,
    isLoading,
    error,
    loadOrders,
    loadOrdersByStatus,
    loadOrdersByTable,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    addItemToOrder,
    updateOrderItem,
    removeOrderItem,
    getCurrentOrderForTable,
    resetStatusFilter,
    currentStatus,
  }
}

export default useOrderApi
