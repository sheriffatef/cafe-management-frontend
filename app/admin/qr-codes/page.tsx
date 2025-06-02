"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import useApi from "@/hooks/use-api"
import QRCodeGenerator from "@/components/qr-code-generator"
import type { Table as TableType } from "@/lib/api"

export default function QRCodesPage() {
  const { toast } = useToast()
  const { isLoading, error, executeApiCall, api } = useApi()
  const [tables, setTables] = useState<TableType[]>([])

  // Load tables on component mount
  useEffect(() => {
    loadTables()
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

  // Load all tables from API
  const loadTables = async () => {
    const result = await executeApiCall(() => api.tables.getAll())
    if (result) {
      setTables(result)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QR Codes</h2>
          <p className="text-muted-foreground">Generate QR codes for table-specific order viewing</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Loading tables...</div>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <p className="text-muted-foreground">
              No tables found. Create tables first to generate QR codes for table order viewing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <QRCodeGenerator key={table.id} tableId={table.id} tableName={table.name} />
          ))}
        </div>
      )}
    </div>
  )
}
