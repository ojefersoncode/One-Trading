"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { getKlineData, getCurrentPrice, timeFrameMap, availableSymbols, updateLastCandle } from "@/lib/binance-api"
import { type Trade, createTrade, calculateTradeResult } from "@/lib/trading-simulator"

interface TradingContextType {
  // Estado
  balance: number
  symbol: string
  timeFrame: string
  tradeAmount: number
  selectedTime: number
  activeTrade: Trade | null
  klineData: any[]
  currentPrice: number | null
  expectedReturn: { amount: string; percentage: string }
  tradeHistory: Trade[]
  isLoading: boolean
  availableSymbols: typeof availableSymbols

  // Ações
  setSymbol: (symbol: string) => void
  setTimeFrame: (timeFrame: string) => void
  setTradeAmount: (amount: number) => void
  setSelectedTime: (minutes: number) => void
  placeTrade: (direction: "up" | "down") => void
  refreshData: () => Promise<void>
  loadMoreHistory: () => Promise<void>
  getSymbolInfo: (symbol: string) => { name: string; category: string; icon?: string } | undefined
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

export function TradingProvider({ children }: { children: ReactNode }) {
  // Estado do trading
  const [balance, setBalance] = useState(20340.48)
  const [symbol, setSymbol] = useState("BTCUSDT")
  const [timeFrame, setTimeFrame] = useState("1M")
  const [tradeAmount, setTradeAmount] = useState(1000)
  const [selectedTime, setSelectedTime] = useState(5) // 5 minutos
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null)
  const [klineData, setKlineData] = useState<any[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)

  // Referências para controlar intervalos
  const priceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const klineUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const consecutiveErrorsRef = useRef(0)
  const lastFullUpdateRef = useRef(Date.now())

  // Calcular retorno esperado
  const expectedReturn = {
    amount: `+$${(tradeAmount * 0.85).toFixed(2)}`,
    percentage: "(+85%)",
  }

  // Verificar se há uma operação ativa que expirou
  useEffect(() => {
    if (!activeTrade || !currentPrice) return

    // Verificar se a operação expirou
    if (Date.now() >= activeTrade.expiryTime) {
      console.log("Operação expirada:", activeTrade)
      console.log("Preço atual:", currentPrice)

      // Calcular resultado
      const completedTrade = calculateTradeResult(activeTrade, currentPrice)
      console.log("Resultado calculado:", completedTrade)

      // Atualizar histórico
      setTradeHistory((prev) => [...prev, completedTrade])

      // Atualizar saldo com base no resultado
      if (completedTrade.result === "win") {
        // Para vitória, adicionar valor original + lucro
        const totalReturn = activeTrade.amount + activeTrade.amount * 0.85
        console.log("Vitória! Retorno total:", totalReturn)
        setBalance((prev) => prev + totalReturn)
      } else if (completedTrade.result === "draw") {
        // Para empate, devolver apenas o valor original
        console.log("Empate! Devolvendo valor original:", activeTrade.amount)
        setBalance((prev) => prev + activeTrade.amount)
      } else {
        // Para derrota, não adicionar nada (o valor já foi subtraído ao criar a operação)
        console.log("Derrota! Valor perdido:", activeTrade.amount)
      }

      // Limpar operação ativa
      setActiveTrade(null)
    }
  }, [activeTrade, currentPrice])

  // Configurar atualizações periódicas quando o símbolo ou timeframe mudar
  useEffect(() => {
    // Limpar intervalos existentes
    if (priceUpdateIntervalRef.current) {
      clearInterval(priceUpdateIntervalRef.current)
    }
    if (klineUpdateIntervalRef.current) {
      clearInterval(klineUpdateIntervalRef.current)
    }

    // Resetar contadores
    consecutiveErrorsRef.current = 0
    lastFullUpdateRef.current = 0

    // Carregar dados iniciais
    refreshData()

    // Configurar intervalo para atualização de preço (a cada 3 segundos)
    priceUpdateIntervalRef.current = setInterval(async () => {
      try {
        // Atualizar apenas o preço atual
        const price = await getCurrentPrice(symbol)
        if (price) {
          setCurrentPrice(price)

          // Atualizar a última vela com o preço atual
          setKlineData((prev) => updateLastCandle(prev, price))

          // Resetar contador de erros
          consecutiveErrorsRef.current = 0
        }
      } catch (error) {
        console.error("Erro ao atualizar preço:", error)
        consecutiveErrorsRef.current++

        // Se tivermos muitos erros consecutivos, forçar atualização completa
        if (consecutiveErrorsRef.current >= 3) {
          console.log("Muitos erros consecutivos, forçando atualização completa")
          refreshData()
        }
      }
    }, 3000)

    // Configurar intervalo para atualização completa dos klines (a cada 30 segundos)
    klineUpdateIntervalRef.current = setInterval(async () => {
      // Verificar se passou tempo suficiente desde a última atualização completa
      const now = Date.now()
      if (now - lastFullUpdateRef.current < 25000) {
        return // Evitar atualizações muito frequentes
      }

      try {
        const binanceInterval = timeFrameMap[timeFrame] || "1h"
        const data = await getKlineData(symbol, binanceInterval, 100)

        if (data.length > 0) {
          setKlineData(data)
          lastFullUpdateRef.current = now

          // Atualizar também o preço atual
          const lastCandle = data[data.length - 1]
          setCurrentPrice(lastCandle.close)
        }
      } catch (error) {
        console.error("Erro ao atualizar klines:", error)
      }
    }, 30000)

    return () => {
      // Limpar intervalos ao desmontar
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current)
      }
      if (klineUpdateIntervalRef.current) {
        clearInterval(klineUpdateIntervalRef.current)
      }
    }
  }, [symbol, timeFrame])

  // Atualizar dados do gráfico quando o símbolo ou timeframe mudar
  const refreshData = async () => {
    setIsLoading(true)
    try {
      const binanceInterval = timeFrameMap[timeFrame] || "1h"
      const data = await getKlineData(symbol, binanceInterval, 100)
      setKlineData(data)
      setHistoryPage(1) // Resetar a página de histórico
      lastFullUpdateRef.current = Date.now()

      const price = await getCurrentPrice(symbol)
      if (price) setCurrentPrice(price)

      // Resetar contador de erros
      consecutiveErrorsRef.current = 0
    } catch (error) {
      console.error("Erro ao atualizar dados:", error)
      consecutiveErrorsRef.current++
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar mais dados históricos
  const loadMoreHistory = async () => {
    if (isLoading) return

    try {
      const binanceInterval = timeFrameMap[timeFrame] || "1h"
      const nextPage = historyPage + 1

      // Calcular o timestamp para buscar dados mais antigos
      const oldestCandleTime = klineData.length > 0 ? klineData[0].time : Date.now()

      // Buscar mais 100 velas anteriores às que já temos
      const moreData = await getKlineData(symbol, binanceInterval, 100, oldestCandleTime)

      if (moreData.length > 0) {
        // Adicionar os novos dados ao início do array
        setKlineData((prev) => [...moreData, ...prev])
        setHistoryPage(nextPage)
        return true
      }

      return false
    } catch (error) {
      console.error("Erro ao carregar mais dados históricos:", error)
      return false
    }
  }

  // Colocar uma operação
  const placeTrade = (direction: "up" | "down") => {
    if (!currentPrice || activeTrade || tradeAmount > balance) return

    // Para fins de teste, podemos reduzir o tempo para 30 segundos
    const newTrade = createTrade(symbol, direction, tradeAmount, currentPrice, selectedTime)

    console.log("Nova operação criada:", newTrade)
    setActiveTrade(newTrade)
    setBalance((prev) => prev - tradeAmount)
  }

  // Obter informações do símbolo
  const getSymbolInfo = (symbolCode: string) => {
    return availableSymbols.find((s) => s.symbol === symbolCode)
  }

  const value = {
    balance,
    symbol,
    timeFrame,
    tradeAmount,
    selectedTime,
    activeTrade,
    klineData,
    currentPrice,
    expectedReturn,
    tradeHistory,
    isLoading,
    availableSymbols,

    setSymbol,
    setTimeFrame,
    setTradeAmount,
    setSelectedTime,
    placeTrade,
    refreshData,
    loadMoreHistory,
    getSymbolInfo,
  }

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
}

export function useTradingContext() {
  const context = useContext(TradingContext)
  if (context === undefined) {
    throw new Error("useTradingContext must be used within a TradingProvider")
  }
  return context
}
