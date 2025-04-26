"use client"

import { useEffect, useState } from "react"
import { useTradingContext } from "./trading-context"
import { formatCurrency } from "@/lib/trading-simulator"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Notification {
  id: string
  type: "success" | "error" | "info"
  message: string
  amount?: string
  timestamp: number
}

export default function TradeNotification() {
  const { tradeHistory } = useTradingContext()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [processedTradeIds, setProcessedTradeIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Verificar se há novas operações concluídas
    if (tradeHistory.length > 0) {
      tradeHistory.forEach((trade) => {
        // Verificar se já processamos esta operação
        if (trade.result && !processedTradeIds.has(trade.id)) {
          console.log("Nova operação concluída para notificação:", trade)

          // Criar notificação com base no resultado
          let type: "success" | "error" | "info"
          let message: string
          let amount: string | undefined

          if (trade.result === "win") {
            type = "success"
            message = "Operação bem-sucedida!"
            // Mostrar o valor total (entrada + lucro)
            amount = formatCurrency(trade.amount + trade.amount * 0.85)
          } else if (trade.result === "loss") {
            type = "error"
            message = "Operação perdida"
            amount = formatCurrency(-trade.amount)
          } else {
            type = "info"
            message = "Operação empatada"
            amount = formatCurrency(trade.amount)
          }

          const newNotification: Notification = {
            id: trade.id,
            type,
            message,
            amount,
            timestamp: Date.now(),
          }

          setNotifications((prev) => [...prev, newNotification])
          setProcessedTradeIds((prev) => new Set(prev).add(trade.id))

          // Remover notificação após 5 segundos
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== trade.id))
          }, 5000)
        }
      })
    }
  }, [tradeHistory])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-3 rounded-md shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${
            notification.type === "success"
              ? "bg-green-900"
              : notification.type === "error"
                ? "bg-red-900"
                : "bg-blue-900"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : notification.type === "error" ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-blue-400" />
          )}
          <div>
            <div className="text-white font-medium">{notification.message}</div>
            {notification.amount && (
              <div
                className={`text-sm ${
                  notification.type === "success"
                    ? "text-green-300"
                    : notification.type === "error"
                      ? "text-red-300"
                      : "text-blue-300"
                }`}
              >
                {notification.amount}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
