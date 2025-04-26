"use client"

import { useTradingContext } from "./trading-context"
import { formatCurrency } from "@/lib/trading-simulator"
import { useEffect, useState } from "react"

export default function ActiveTradeIndicator() {
  const { activeTrade, currentPrice } = useTradingContext()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentResult, setCurrentResult] = useState<"win" | "loss" | "draw" | null>(null)
  const [potentialReturn, setPotentialReturn] = useState<number | null>(null)

  useEffect(() => {
    if (!activeTrade) return

    // Atualizar o tempo restante a cada segundo
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeTrade.expiryTime - Date.now()) / 1000))
      setTimeRemaining(remaining)

      // Se o tempo acabou, limpar o intervalo
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeTrade])

  // Calcular o resultado atual com base no preço atual
  useEffect(() => {
    if (!activeTrade || !currentPrice) return

    let result: "win" | "loss" | "draw" = "draw"
    let returnValue: number = activeTrade.amount

    if (activeTrade.direction === "up") {
      if (currentPrice > activeTrade.entryPrice) {
        result = "win"
        returnValue = activeTrade.amount + activeTrade.amount * 0.85
      } else if (currentPrice < activeTrade.entryPrice) {
        result = "loss"
        returnValue = 0
      }
    } else {
      // direction === 'down'
      if (currentPrice < activeTrade.entryPrice) {
        result = "win"
        returnValue = activeTrade.amount + activeTrade.amount * 0.85
      } else if (currentPrice > activeTrade.entryPrice) {
        result = "loss"
        returnValue = 0
      }
    }

    setCurrentResult(result)
    setPotentialReturn(returnValue)
  }, [activeTrade, currentPrice])

  if (!activeTrade) return null

  // Calcular a porcentagem de tempo decorrido
  const totalDuration = (activeTrade.expiryTime - activeTrade.entryTime) / 1000
  const elapsed = totalDuration - timeRemaining
  const progressPercent = Math.min(100, (elapsed / totalDuration) * 100)

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-gray-900/80 p-3 rounded-md">
      <div className="text-white text-sm flex justify-between items-center mb-1">
        <span>
          {activeTrade.direction === "up" ? "⬆️ ACIMA" : "⬇️ ABAIXO"} • {formatCurrency(activeTrade.amount)}
        </span>
        <span className="font-bold">{timeRemaining}s</span>
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            currentResult === "win" ? "bg-green-500" : currentResult === "loss" ? "bg-red-500" : "bg-blue-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Informações adicionais */}
      <div className="flex justify-between text-xs mt-1">
        <span>Entrada: {activeTrade.entryPrice.toFixed(6)}</span>
        <span>Atual: {currentPrice?.toFixed(6) || "-"}</span>
        <span
          className={
            currentResult === "win" ? "text-green-500" : currentResult === "loss" ? "text-red-500" : "text-blue-500"
          }
        >
          {currentResult === "win"
            ? `GANHO (${formatCurrency(potentialReturn || 0)})`
            : currentResult === "loss"
              ? "PERDA"
              : `EMPATE (${formatCurrency(activeTrade.amount)})`}
        </span>
      </div>
    </div>
  )
}
