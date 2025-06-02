import axios, { type AxiosError } from "axios"

/**
 * Base API configuration
 * Change the baseURL to match your .NET backend API URL
 * For local development, this might be something like http://localhost:5000/api
 * For production, this would be your deployed API URL
 */
const API_BASE_URL = "https://cafemanagement-production.up.railway.app/api"

/**
 * Token management functions
 */
export const tokenService = {
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  },

  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  },

  removeToken: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  },

  isAuthenticated: (): boolean => {
    return !!tokenService.getToken()
  },
}

/**
 * Axios instance with default configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // 10 seconds
})

/**
 * Request interceptor to add auth token to requests
 */
api.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      tokenService.removeToken()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

/**
 * Types for API requests and responses
 */
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  token: string
  user: User
}

// User Types
export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "manager" | "staff" | "customer"
  status: "active" | "inactive"
  joinedAt: string
}

// Table Types
export interface Table {
  id: number
  name: string
  capacity: number
  status: "available" | "occupied" | "reserved"
}

export interface TableWithOrder extends Table {
  currentOrder: Order | null
}

export interface CreateTableRequest {
  name: string
  capacity: number
  status: "available" | "occupied" | "reserved"
}

export interface UpdateTableStatusRequest {
  status: "available" | "occupied" | "reserved"
}

// Product Types
export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
}

export interface CreateProductRequest {
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
}

// Order Types
export interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number
}

export interface Order {
  id: number
  tableId: number
  userId: number
  status: "new" | "preparing" | "ready" | "delivered" | "paid"
  items: OrderItem[]
  total: number
  orderDate: string
}

export interface CreateOrderRequest {
  tableId: number
  items: {
    productId: number
    quantity: number
  }[]
}

export interface UpdateOrderStatusRequest {
  status: "new" | "preparing" | "ready" | "delivered" | "paid"
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Login user with email and password
   * @param credentials - User login credentials
   * @returns Promise with auth token and user data
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials)
    tokenService.setToken(response.data.token)
    return response.data
  },

  /**
   * Register a new user
   * @param userData - New user registration data
   * @returns Promise with auth token and user data
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", userData)
    tokenService.setToken(response.data.token)
    return response.data
  },

  /**
   * Logout current user
   * @returns Promise with logout confirmation
   */
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout")
    } catch (error) {
      // Even if the API call fails, we still want to remove the token
      console.error("Logout API call failed", error)
    } finally {
      tokenService.removeToken()
    }
  },

  /**
   * Get current user profile
   * @returns Promise with user data
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me")
    return response.data
  },

  /**
   * Check if token is valid
   * @returns Promise with boolean indicating if token is valid
   */
  validateToken: async (): Promise<boolean> => {
    try {
      await api.get("/auth/validate")
      return true
    } catch (error) {
      tokenService.removeToken()
      return false
    }
  },
}

/**
 * Users API
 */
export const usersApi = {
  /**
   * Get all users
   * @param role - Optional role filter
   * @param status - Optional status filter
   * @returns Promise with array of users
   */
  getAll: async (role?: string, status?: string): Promise<User[]> => {
    const params = { role, status }
    const response = await api.get<User[]>("/users", { params })
    return response.data
  },

  /**
   * Get user by ID
   * @param id - User ID
   * @returns Promise with user data
   */
  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`)
    return response.data
  },

  /**
   * Create a new user
   * @param userData - New user data
   * @returns Promise with created user data
   */
  create: async (userData: Omit<User, "id" | "joinedAt">): Promise<User> => {
    const response = await api.post<User>("/users", userData)
    return response.data
  },

  /**
   * Update an existing user
   * @param id - User ID
   * @param userData - Updated user data
   * @returns Promise with updated user data
   */
  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, userData)
    return response.data
  },

  /**
   * Update user status
   * @param id - User ID
   * @param status - New status (active/inactive)
   * @returns Promise with updated user data
   */
  updateStatus: async (id: number, status: "active" | "inactive"): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/status`, { status })
    return response.data
  },

  /**
   * Delete a user
   * @param id - User ID
   * @returns Promise with void
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}

/**
 * Tables API
 */
export const tablesApi = {
  /**
   * Get all tables
   * @param status - Optional status filter
   * @param capacity - Optional minimum capacity filter
   * @returns Promise with array of tables
   */
  getAll: async (status?: string, capacity?: number): Promise<Table[]> => {
    const params = { status, capacity }
    const response = await api.get<Table[]>("/tables", { params })
    return response.data
  },

  /**
   * Get table by ID
   * @param id - Table ID
   * @returns Promise with table data
   */
  getById: async (id: number): Promise<Table> => {
    const response = await api.get<Table>(`/tables/${id}`)
    return response.data
  },

  /**
   * Get table with its current order
   * @param id - Table ID
   * @returns Promise with table and order data
   */
  getWithOrder: async (id: number): Promise<TableWithOrder> => {
    const response = await api.get<TableWithOrder>(`/tables/${id}/order`)
    return response.data
  },

  /**
   * Get tables by status
   * @param status - Table status (available, occupied, reserved)
   * @returns Promise with array of tables
   */
  getByStatus: async (status: "available" | "occupied" | "reserved"): Promise<Table[]> => {
    const response = await api.get<Table[]>(`/tables/status/${status}`)
    return response.data
  },

  /**
   * Create a new table
   * @param tableData - New table data
   * @returns Promise with created table data
   */
  create: async (tableData: CreateTableRequest): Promise<Table> => {
    const response = await api.post<Table>("/tables", tableData)
    return response.data
  },

  /**
   * Update an existing table
   * @param id - Table ID
   * @param tableData - Updated table data
   * @returns Promise with updated table data
   */
  update: async (id: number, tableData: Partial<Table>): Promise<Table> => {
    const response = await api.put<Table>(`/tables/${id}`, tableData)
    return response.data
  },

  /**
   * Update table status
   * @param id - Table ID
   * @param status - New status (available, occupied, reserved)
   * @returns Promise with updated table data
   */
  updateStatus: async (id: number, status: "available" | "occupied" | "reserved"): Promise<Table> => {
    const response = await api.patch<Table>(`/tables/${id}/status`, { status })
    return response.data
  },

  /**
   * Delete a table
   * @param id - Table ID
   * @returns Promise with void
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tables/${id}`)
  },
}

/**
 * Products API
 */
export const productsApi = {
  /**
   * Get all products
   * @param category - Optional category filter
   * @returns Promise with array of products
   */
  getAll: async (category?: string): Promise<Product[]> => {
    const params = { category }
    const response = await api.get<Product[]>("/products", { params })
    return response.data
  },

  /**
   * Get product by ID
   * @param id - Product ID
   * @returns Promise with product data
   */
  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`)
    return response.data
  },

  /**
   * Get products by category
   * @param category - Product category
   * @returns Promise with array of products
   */
  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/category/${category}`)
    return response.data
  },

  /**
   * Create a new product
   * @param productData - New product data
   * @returns Promise with created product data
   */
  create: async (productData: CreateProductRequest): Promise<Product> => {
    const response = await api.post<Product>("/products", productData)
    return response.data
  },

  /**
   * Update an existing product
   * @param id - Product ID
   * @param productData - Updated product data
   * @returns Promise with updated product data
   */
  update: async (id: number, productData: Partial<Product>): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, productData)
    return response.data
  },

  /**
   * Delete a product
   * @param id - Product ID
   * @returns Promise with void
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`)
  },
}

/**
 * Orders API
 */
export const ordersApi = {
  /**
   * Get all orders
   * @param status - Optional status filter
   * @returns Promise with array of orders
   */
  getAll: async (status?: string): Promise<Order[]> => {
    const params = { status }
    const response = await api.get<Order[]>("/orders", { params })
    return response.data
  },

  /**
   * Get order by ID
   * @param id - Order ID
   * @returns Promise with order data
   */
  getById: async (id: number): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`)
    return response.data
  },

  /**
   * Get orders by table
   * @param tableId - Table ID
   * @returns Promise with array of orders
   */
  getByTable: async (tableId: number): Promise<Order[]> => {
    const response = await api.get<Order[]>(`/orders/table/${tableId}`)
    return response.data
  },

  /**
   * Get orders by status
   * @param status - Order status
   * @returns Promise with array of orders
   */
  getByStatus: async (status: "new" | "preparing" | "ready" | "delivered" | "paid"): Promise<Order[]> => {
    const response = await api.get<Order[]>(`/orders/status/${status}`)
    return response.data
  },

  /**
   * Create a new order
   * @param orderData - New order data
   * @returns Promise with created order data
   */
  create: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<Order>("/orders", orderData)
    return response.data
  },

  /**
   * Update order status
   * @param id - Order ID
   * @param status - New status
   * @returns Promise with updated order data
   */
  updateStatus: async (id: number, status: "new" | "preparing" | "ready" | "delivered" | "paid"): Promise<Order> => {
    const response = await api.patch<Order>(`/orders/${id}/status`, { status })
    return response.data
  },

  /**
   * Delete an order
   * @param id - Order ID
   * @returns Promise with void
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/orders/${id}`)
  },

  /**
   * Get items for an order
   * @param orderId - Order ID
   * @returns Promise with array of order items
   */
  getItems: async (orderId: number): Promise<OrderItem[]> => {
    const response = await api.get<OrderItem[]>(`/orders/${orderId}/items`)
    return response.data
  },

  /**
   * Add item to order
   * @param orderId - Order ID
   * @param item - Order item data
   * @returns Promise with added order item
   */
  addItem: async (orderId: number, item: { productId: number; quantity: number }): Promise<OrderItem> => {
    const response = await api.post<OrderItem>(`/orders/${orderId}/items`, item)
    return response.data
  },

  /**
   * Update order item
   * @param orderId - Order ID
   * @param itemId - Item ID
   * @param quantity - New quantity
   * @returns Promise with updated order item
   */
  updateItem: async (orderId: number, itemId: number, quantity: number): Promise<OrderItem> => {
    const response = await api.put<OrderItem>(`/orders/${orderId}/items/${itemId}`, { quantity })
    return response.data
  },

  /**
   * Remove item from order
   * @param orderId - Order ID
   * @param itemId - Item ID
   * @returns Promise with void
   */
  removeItem: async (orderId: number, itemId: number): Promise<void> => {
    await api.delete(`/orders/${orderId}/items/${itemId}`)
  },
}

/**
 * Error handling utility
 * @param error - Error object from API call
 * @returns Formatted error message
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; details?: string | Record<string, string> }>

    // Handle network errors first
    if (axiosError.message === "Network Error") {
      return "Cannot connect to the server. Please check your connection or try again later."
    }

    // Handle structured API errors
    if (axiosError.response?.data) {
      const { error: errorMessage, details } = axiosError.response.data as any

      if (errorMessage) {
        return errorMessage
      }

      if (details) {
        if (typeof details === "string") {
          return details
        }

        // Handle validation errors
        return Object.values(details).join(", ")
      }
    }

    // Handle HTTP errors
    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 400:
          return "Bad request. Please check your input."
        case 401:
          return "Unauthorized. Please log in again."
        case 403:
          return "Forbidden. You do not have permission to access this resource."
        case 404:
          return "Resource not found."
        case 500:
          return "Server error. Please try again later."
        default:
          return `Error: ${axiosError.response.status}`
      }
    }

    // Handle request errors
    if (axiosError.request) {
      return "Network error. Please check your connection."
    }
  }

  // Handle generic errors
  return error instanceof Error ? error.message : "An unknown error occurred"
}

// Export default API object with all services
const apiService = {
  auth: authApi,
  users: usersApi,
  tables: tablesApi,
  products: productsApi,
  orders: ordersApi,
  handleError: handleApiError,
}

export default apiService
