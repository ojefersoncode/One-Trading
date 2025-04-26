import { useTradingContext } from "./trading-context"
import { formatCurrency } from "@/lib/trading-simulator"

export default function TradeHistory() {
  const { tradeHistory } = useTradingContext()

  console.log("Histórico de operações:", tradeHistory)

  if (tradeHistory.length === 0) {
    return <div className="p-4 text-center text-gray-400">Nenhuma operação realizada ainda</div>
  }

  return (
    <div className="p-4 max-h-80 overflow-y-auto">
      <h3 className="text-lg font-bold mb-3">Histórico de Operações ({tradeHistory.length})</h3>
      <div className="space-y-2">
        {tradeHistory.map((trade) => (
          <div
            key={trade.id}
            className={`p-3 rounded-md flex justify-between items-center ${
              trade.result === "win" ? "bg-green-900/30" : trade.result === "loss" ? "bg-red-900/30" : "bg-gray-800/30"
            }`}
          >
            <div>
              <div className="font-medium">
                {trade.symbol} • {trade.direction === "up" ? "⬆️ ACIMA" : "⬇️ ABAIXO"}
              </div>
              <div className="text-sm text-gray-400">
                {new Date(trade.entryTime).toLocaleTimeString()} • Entrada: {trade.entryPrice.toFixed(6)} • Saída:{" "}
                {trade.exitPrice?.toFixed(6) || "-"}
              </div>
            </div>
            <div
              className={`font-bold ${
                trade.result === "win" ? "text-green-500" : trade.result === "loss" ? "text-red-500" : "text-gray-400"
              }`}
            >
              {trade.profit !== undefined ? formatCurrency(trade.profit) : "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
