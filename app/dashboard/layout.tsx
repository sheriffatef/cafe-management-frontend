import type { ReactNode } from "react"
import Link from "next/link"
import { Coffee, LayoutDashboard, MenuIcon, ShoppingBag, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AuthGuard } from "@/components/auth-guard"
import { UserProfile } from "@/components/user-profile"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="flex items-center space-x-2 md:mr-6">
              <Coffee className="h-6 w-6" />
              <span className="hidden font-bold md:inline-block">Cafe Manager</span>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mr-2 md:hidden">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                <nav className="flex flex-col gap-4 py-4">
                  <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1 text-lg font-semibold">
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard/tables" className="flex items-center gap-2 px-2 py-1 text-lg font-semibold">
                    <MenuIcon className="h-5 w-5" />
                    Tables
                  </Link>
                  <Link href="/dashboard/orders" className="flex items-center gap-2 px-2 py-1 text-lg font-semibold">
                    <ShoppingBag className="h-5 w-5" />
                    Orders
                  </Link>
                  <Link href="/dashboard/products" className="flex items-center gap-2 px-2 py-1 text-lg font-semibold">
                    <Coffee className="h-5 w-5" />
                    Products
                  </Link>
                  <Link href="/dashboard/users" className="flex items-center gap-2 px-2 py-1 text-lg font-semibold">
                    <Users className="h-5 w-5" />
                    Users
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/dashboard/tables" className="text-sm font-medium transition-colors hover:text-primary">
                  Tables
                </Link>
                <Link href="/dashboard/orders" className="text-sm font-medium transition-colors hover:text-primary">
                  Orders
                </Link>
                <Link href="/dashboard/products" className="text-sm font-medium transition-colors hover:text-primary">
                  Products
                </Link>
                <Link href="/dashboard/users" className="text-sm font-medium transition-colors hover:text-primary">
                  Users
                </Link>
              </nav>
              <div className="flex items-center gap-2">
                <UserProfile />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </AuthGuard>
  )
}
