"use client"

import { useState, useCallback } from "react"
import apiService, { handleApiError } from "@/lib/api"

/**
 * Custom hook for making API calls with loading and error states
 * @returns Object with loading state, error state, and API methods
 */
export function useApi() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Execute an API call with loading and error handling
   * @param apiCall - Function that returns a Promise
   * @returns Promise with the result of the API call
   */
  const executeApiCall = useCallback(async (apiCall) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      return result
    } catch (err) {
      console.error("API call error:", err)
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Clear any existing error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    clearError,
    executeApiCall,
    api: apiService,
  }
}

export default useApi
