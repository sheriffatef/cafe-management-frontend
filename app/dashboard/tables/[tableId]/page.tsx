"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function TableWelcomePage() {
  const params = useParams()
  const router = useRouter()
  const tableId = params.tableId as string

  useEffect(() => {
    // Redirect directly to the menu for this table
    router.push(`/table/${tableId}/menu`)
  }, [tableId, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-lg text-gray-600">Redirecting to menu...</p>
      </div>
    </div>
  )
}
