"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import useApi from "@/hooks/use-api"
import type { Table } from "@/lib/api"

// QR Code component
function QRCodeDisplay({ tableId, tableName }: { tableId: number; tableName: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    // Generate QR code URL for the table
    const tableUrl = `${window.location.origin}/dashboard/orders/table/${tableId}`
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tableUrl)}`
    setQrCodeUrl(qrApiUrl)
  }, [tableId])

  const downloadQRCode = () => {
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `table-${tableId}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg">{tableName}</h3>
        <p className="text-sm text-muted-foreground">Scan to view orders</p>
      </div>
      {qrCodeUrl && (
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
          <img src={qrCodeUrl || "/placeholder.svg"} alt={`QR Code for ${tableName}`} className="w-48 h-48" />
        </div>
      )}
      <Button onClick={downloadQRCode} variant="outline" size="sm" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        Download QR Code
      </Button>
    </div>
  )
}

export default function TablesPage() {
  const { toast } = useToast()
  const { isLoading, error, executeApiCall, api } = useApi()
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showQRCode, setShowQRCode] = useState<Table | null>(null)
  const [newTable, setNewTable] = useState({
    name: "",
    capacity: 2,
    status: "available" as const,
  })

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

  // Handle table click to show details
  const handleTableClick = (table: Table) => {
    setSelectedTable(table)
  }

  // Handle QR code generation
  const handleShowQRCode = (table: Table) => {
    setShowQRCode(table)
  }

  // Handle creating a new table
  const handleCreateTable = async () => {
    const result = await executeApiCall(() =>
      api.tables.create({
        name: newTable.name,
        capacity: newTable.capacity,
        status: newTable.status,
      }),
    )

    if (result) {
      setTables([...tables, result])
      toast({
        title: "Success",
        description: "Table created successfully",
      })

      // Reset form
      setNewTable({
        name: "",
        capacity: 2,
        status: "available",
      })
    }
  }

  // Handle updating table status
  const handleUpdateStatus = async (tableId: number, newStatus: "available" | "occupied" | "reserved") => {
    const result = await executeApiCall(() => api.tables.updateStatus(tableId, newStatus))

    if (result) {
      // Update tables list with the updated table
      setTables(tables.map((table) => (table.id === tableId ? result : table)))
      setSelectedTable(null)

      toast({
        title: "Success",
        description: `Table status updated to ${newStatus}`,
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-500 text-green-700"
      case "occupied":
        return "bg-red-100 border-red-500 text-red-700"
      case "reserved":
        return "bg-yellow-100 border-yellow-500 text-yellow-700"
      default:
        return "bg-gray-100 border-gray-500 text-gray-700"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tables</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add New Table</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>Create a new table for your cafe.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Table name"
                  className="col-span-3"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Number of seats"
                  className="col-span-3"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: Number.parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateTable}
                disabled={isLoading || !newTable.name || newTable.capacity < 1}
              >
                {isLoading ? "Creating..." : "Save Table"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tables</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="occupied">Occupied</TabsTrigger>
          <TabsTrigger value="reserved">Reserved</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">Loading tables...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((table) => (
                <Card key={table.id} className={`cursor-pointer border-2 ${getStatusColor(table.status)}`}>
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold">{table.name}</div>
                    <div className="text-sm">Capacity: {table.capacity}</div>
                    <div className="text-sm capitalize mt-2">{table.status}</div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTableClick(table)
                        }}
                        className="flex-1"
                      >
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShowQRCode(table)
                        }}
                        className="px-2"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        {["available", "occupied", "reserved"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">Loading tables...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables
                  .filter((table) => table.status === status)
                  .map((table) => (
                    <Card key={table.id} className={`cursor-pointer border-2 ${getStatusColor(table.status)}`}>
                      <CardContent className="p-4">
                        <div className="text-lg font-semibold">{table.name}</div>
                        <div className="text-sm">Capacity: {table.capacity}</div>
                        <div className="text-sm capitalize mt-2">{table.status}</div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTableClick(table)
                            }}
                            className="flex-1"
                          >
                            Manage
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShowQRCode(table)
                            }}
                            className="px-2"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Table Management Dialog */}
      {selectedTable && (
        <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTable.name}</DialogTitle>
              <DialogDescription>Manage this table</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3 capitalize">{selectedTable.status}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Capacity</Label>
                <div className="col-span-3">{selectedTable.capacity} seats</div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedTable.status === "available" && (
                <>
                  <Button className="w-full sm:w-auto" onClick={() => handleUpdateStatus(selectedTable.id, "occupied")}>
                    Mark as Occupied
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handleUpdateStatus(selectedTable.id, "reserved")}
                  >
                    Mark as Reserved
                  </Button>
                </>
              )}
              {selectedTable.status === "occupied" && (
                <Button className="w-full sm:w-auto" onClick={() => handleUpdateStatus(selectedTable.id, "available")}>
                  Mark as Available
                </Button>
              )}
              {selectedTable.status === "reserved" && (
                <>
                  <Button className="w-full sm:w-auto" onClick={() => handleUpdateStatus(selectedTable.id, "occupied")}>
                    Check In
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handleUpdateStatus(selectedTable.id, "available")}
                  >
                    Cancel Reservation
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedTable(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Dialog */}
      {showQRCode && (
        <Dialog open={!!showQRCode} onOpenChange={() => setShowQRCode(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>QR Code for {showQRCode.name}</DialogTitle>
              <DialogDescription>Customers can scan this QR code to view orders for this table</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <QRCodeDisplay tableId={showQRCode.id} tableName={showQRCode.name} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQRCode(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
