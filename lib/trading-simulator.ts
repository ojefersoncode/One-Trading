// Simulador de trading para operações binárias

export interface Trade {
  id: string
  symbol: string
  direction: "up" | "down"
  amount: number
  entryPrice: number
  entryTime: number
  expiryTime: number
  result?: "win" | "loss" | "draw"
  exitPrice?: number
  profit?: number
}

export interface TradeHistory {
  trades: Trade[]
  balance: number
}

// Calcular resultado de uma operação
export function calculateTradeResult(trade: Trade, currentPrice: number): Trade {
  console.log(
    `Calculando resultado: Preço de entrada ${trade.entryPrice}, Preço atual ${currentPrice}, Direção ${trade.direction}`,
  )

  const updatedTrade = {
    ...trade,
    exitPrice: currentPrice,
  }

  if (trade.direction === "up") {
    if (currentPrice > trade.entryPrice) {
      updatedTrade.result = "win"
      updatedTrade.profit = trade.amount + trade.amount * 0.85 // Valor original + 85% de lucro
      console.log(`Resultado: WIN, Retorno total: ${updatedTrade.profit}`)
    } else if (currentPrice < trade.entryPrice) {
      updatedTrade.result = "loss"
      updatedTrade.profit = -trade.amount // Perda total do valor investido
      console.log(`Resultado: LOSS, Prejuízo: ${updatedTrade.profit}`)
    } else {
      updatedTrade.result = "draw"
      updatedTrade.profit = trade.amount // Empate retorna o valor investido
      console.log(`Resultado: DRAW, Valor retornado: ${updatedTrade.profit}`)
    }
  } else {
    // direction === 'down'
    if (currentPrice < trade.entryPrice) {
      updatedTrade.result = "win"
      updatedTrade.profit = trade.amount + trade.amount * 0.85 // Valor original + 85% de lucro
      console.log(`Resultado: WIN, Retorno total: ${updatedTrade.profit}`)
    } else if (currentPrice > trade.entryPrice) {
      updatedTrade.result = "loss"
      updatedTrade.profit = -trade.amount // Perda total do valor investido
      console.log(`Resultado: LOSS, Prejuízo: ${updatedTrade.profit}`)
    } else {
      updatedTrade.result = "draw"
      updatedTrade.profit = trade.amount // Empate retorna o valor investido
      console.log(`Resultado: DRAW, Valor retornado: ${updatedTrade.profit}`)
    }
  }

  return updatedTrade
}

// Criar uma nova operação
export function createTrade(
  symbol: string,
  direction: "up" | "down",
  amount: number,
  entryPrice: number,
  durationInMinutes: number,
): Trade {
  const now = Date.now()

  // Para fins de teste, podemos usar segundos em vez de minutos
  // const expiryTime = now + durationInMinutes * 60 * 1000;

  // Usar 30 segundos para teste (facilita o teste)
  const expiryTime = now + durationInMinutes * 60 * 1000

  return {
    id: `trade-${now}-${Math.random().toString(36).substring(2, 9)}`,
    symbol,
    direction,
    amount,
    entryPrice,
    entryTime: now,
    expiryTime,
  }
}

// Atualizar histórico de operações
export function updateTradeHistory(history: TradeHistory, trade: Trade): TradeHistory {
  const updatedTrades = [...history.trades]
  const existingTradeIndex = updatedTrades.findIndex((t) => t.id === trade.id)

  if (existingTradeIndex >= 0) {
    updatedTrades[existingTradeIndex] = trade
  } else {
    updatedTrades.push(trade)
  }

  // Atualizar saldo apenas se a operação tiver um resultado
  let updatedBalance = history.balance
  if (trade.result && !history.trades.find((t) => t.id === trade.id)?.result) {
    updatedBalance += trade.profit || 0
  }

  return {
    trades: updatedTrades,
    balance: updatedBalance,
  }
}

// Formatar valor monetário
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Calcular retorno esperado
export function calculateExpectedReturn(amount: number): { amount: string; percentage: string } {
  const totalReturn = amount + amount * 0.85
  return {
    amount: formatCurrency(totalReturn),
    percentage: `(+85%)`,
  }
}
