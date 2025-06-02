"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  tableId: number
  tableName: string
}

export default function QRCodeGenerator({ tableId, tableName }: QRCodeGeneratorProps) {
  const { toast } = useToast()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [tableUrl, setTableUrl] = useState<string>("")

  useEffect(() => {
    // Generate the table-specific URL - now points to the new clean route
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
    const generatedTableUrl = `${baseUrl}/table-orders/${tableId}`
    setTableUrl(generatedTableUrl)

    // Generate QR code URL using the table URL
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedTableUrl)}`
    setQrCodeUrl(qrApiUrl)
  }, [tableId])

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${tableName.toLowerCase().replace(/\s+/g, "-")}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: `QR code for ${tableName} downloaded successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      })
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(tableUrl)
      toast({
        title: "Success",
        description: "Table URL copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      })
    }
  }

  const openUrl = () => {
    window.open(tableUrl, "_blank")
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{tableName}</CardTitle>
        <p className="text-sm text-muted-foreground">Table {tableId}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl || "/placeholder.svg"}
                alt={`QR Code for ${tableName}`}
                className="w-48 h-48"
                onError={(e) => {
                  console.error("Failed to load QR code image")
                  e.currentTarget.src = "/placeholder.svg?height=192&width=192&text=QR+Code"
                }}
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500">Loading QR Code...</span>
              </div>
            )}
          </div>
        </div>

        {/* URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Table URL:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tableUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
            />
            <Button size="sm" variant="outline" onClick={copyUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button onClick={downloadQRCode} className="w-full flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download QR Code
          </Button>
          <Button onClick={openUrl} variant="outline" className="w-full flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Test URL
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>Customers can scan this QR code to view orders for this table</p>
          <p>No login required - direct access to table orders</p>
        </div>
      </CardContent>
    </Card>
  )
}
