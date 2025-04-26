import { useTradingContext } from "./trading-context"
import { formatCurrency } from "@/lib/trading-simulator"

export default function AccountSummary() {
  const { tradeHistory, balance } = useTradingContext()

  // Calcular estatísticas
  const totalTrades = tradeHistory.length
  const winTrades = tradeHistory.filter((t) => t.result === "win").length
  const lossTrades = tradeHistory.filter((t) => t.result === "loss").length
  const drawTrades = tradeHistory.filter((t) => t.result === "draw").length

  const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0

  const totalProfit = tradeHistory.reduce((sum, trade) => sum + (trade.profit || 0), 0)

  return (
    <div className="p-4 bg-[#131722] rounded-md">
      <h3 className="text-lg font-bold mb-3">Resumo da Conta</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#0d1117] p-3 rounded-md">
          <div className="text-sm text-gray-400">Saldo</div>
          <div className="text-xl font-bold">{formatCurrency(balance)}</div>
        </div>

        <div className="bg-[#0d1117] p-3 rounded-md">
          <div className="text-sm text-gray-400">Lucro/Prejuízo</div>
          <div className={`text-xl font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(totalProfit)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#0d1117] p-2 rounded-md text-center">
          <div className="text-xs text-gray-400">Operações</div>
          <div className="font-bold">{totalTrades}</div>
        </div>

        <div className="bg-green-900/30 p-2 rounded-md text-center">
          <div className="text-xs text-gray-400">Ganhos</div>
          <div className="font-bold text-green-500">{winTrades}</div>
        </div>

        <div className="bg-red-900/30 p-2 rounded-md text-center">
          <div className="text-xs text-gray-400">Perdas</div>
          <div className="font-bold text-red-500">{lossTrades}</div>
        </div>

        <div className="bg-blue-900/30 p-2 rounded-md text-center">
          <div className="text-xs text-gray-400">Empates</div>
          <div className="font-bold text-blue-500">{drawTrades}</div>
        </div>
      </div>

      {totalTrades > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-400 mb-1">Taxa de Acerto</div>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${winRate}%` }}></div>
          </div>
          <div className="text-right text-xs mt-1">{winRate.toFixed(1)}%</div>
        </div>
      )}
    </div>
  )
}
