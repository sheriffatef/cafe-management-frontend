"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import apiService, { tokenService, type User, type LoginRequest, type RegisterRequest } from "@/lib/api"

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<boolean>
  register: (userData: RegisterRequest) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (tokenService.isAuthenticated()) {
        try {
          const isValid = await apiService.auth.validateToken()
          if (isValid) {
            const userData = await apiService.auth.getCurrentUser()
            setUser(userData)
          }
        } catch (err) {
          console.error("Error validating token:", err)
          tokenService.removeToken()
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.auth.login(credentials)
      tokenService.setToken(response.token)
      setUser(response.user)
      return true
    } catch (err) {
      const errorMessage = apiService.handleError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Register function
  const register = async (userData: RegisterRequest): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiService.auth.register(userData)
      tokenService.setToken(response.token)
      setUser(response.user)
      return true
    } catch (err) {
      const errorMessage = apiService.handleError(err)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)

    try {
      await apiService.auth.logout()
    } catch (err) {
      console.error("Error during logout:", err)
    } finally {
      tokenService.removeToken()
      setUser(null)
      router.push("/login")
      setIsLoading(false)
    }
  }, [router])

  // Clear error
  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    clearError,
  }
}

export default useAuth
