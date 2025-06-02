"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { tokenService } from "@/lib/api"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/register", "/menu"]

    const checkAuth = async () => {
      const isPublicRoute = publicRoutes.includes(pathname)
      const isAuthenticated = tokenService.isAuthenticated()

      if (!isPublicRoute && !isAuthenticated) {
        // Redirect to login if trying to access protected route without authentication
        router.push("/login")
      } else if (pathname === "/login" && isAuthenticated) {
        // Redirect to dashboard if already logged in and trying to access login page
        router.push("/dashboard")
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [pathname, router])

  if (isChecking) {
    // You could show a loading spinner here
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return <>{children}</>
}

export default AuthGuard
