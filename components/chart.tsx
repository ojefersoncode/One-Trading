"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTradingContext } from "./trading-context"
import { ZoomIn, ZoomOut, RefreshCw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function Chart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { klineData, currentPrice, refreshData, loadMoreHistory, symbol, timeFrame, isLoading } = useTradingContext()

  // Estado para controlar o zoom e posição do gráfico
  const [scale, setScale] = useState(1.5)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0) // Offset vertical para navegação para cima/baixo
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hoveredCandle, setHoveredCandle] = useState<{
    index: number
    x: number
    y: number
    candle: any
  } | null>(null)
  const [lastRender, setLastRender] = useState(Date.now())

  // Referência para armazenar os dados do gráfico para evitar recálculos
  const chartDataRef = useRef({
    width: 0,
    height: 0,
    maxPrice: 0,
    minPrice: 0,
    priceRange: 0,
    candleWidth: 0,
    rightPadding: 100, // Espaço à direita do gráfico
    initialOffset: 0,
    finalOffset: 0,
    visibleCandleCount: 0,
    originalMaxPrice: 0, // Preço máximo original antes do ajuste vertical
    originalMinPrice: 0, // Preço mínimo original antes do ajuste vertical
  })

  // Função para carregar mais dados históricos
  const handleLoadMoreHistory = useCallback(async () => {
    if (isLoadingMore) return

    setIsLoadingMore(true)
    try {
      await loadMoreHistory()
      // Ajustar o offset para manter a posição atual após carregar mais dados
      setOffsetX((prev) => prev - chartDataRef.current.candleWidth * 50) // Assumindo que carregamos 50 velas a mais
    } catch (error) {
      console.error("Erro ao carregar mais dados históricos:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [loadMoreHistory, isLoadingMore])

  // Usar requestAnimationFrame para renderização suave
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || klineData.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar dimensões do canvas
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Função de animação
    let animationFrameId: number

    const render = () => {
      const now = Date.now()
      // Limitar a taxa de renderização para melhorar o desempenho
      if (now - lastRender > 33) {
        // ~30fps
        updateChartData(canvas.width, canvas.height)
        drawChart(ctx)
        setLastRender(now)
      }
      animationFrameId = requestAnimationFrame(render)
    }

    // Iniciar loop de renderização
    render()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [klineData, currentPrice, scale, offsetX, offsetY, lastRender])

  // Atualizar dados do gráfico
  const updateChartData = (width: number, height: number) => {
    if (klineData.length === 0) return

    // Encontrar valores máximos e mínimos para escala
    let maxPrice = Math.max(...klineData.map((candle) => candle.high))
    let minPrice = Math.min(...klineData.map((candle) => candle.low))

    // Armazenar os valores originais
    chartDataRef.current.originalMaxPrice = maxPrice
    chartDataRef.current.originalMinPrice = minPrice

    // Adicionar margem
    const pricePadding = (maxPrice - minPrice) * 0.1
    maxPrice += pricePadding
    minPrice -= pricePadding

    // Aplicar o offset vertical
    const priceRange = maxPrice - minPrice
    const verticalAdjustment = priceRange * 0.1 // 10% do range de preços para cada clique

    // Ajustar os preços máximo e mínimo com base no offset vertical
    maxPrice -= offsetY * verticalAdjustment
    minPrice -= offsetY * verticalAdjustment

    // Calcular largura das velas considerando o zoom
    const candleWidth = Math.max(5, (width - chartDataRef.current.rightPadding) / (klineData.length / scale))

    // Calcular o espaço total disponível para as velas
    const totalCandleWidth = candleWidth * klineData.length

    // Calcular o deslocamento inicial para centralizar as velas
    const initialOffset = Math.max(0, (width - chartDataRef.current.rightPadding - totalCandleWidth) / 2)

    // Aplicar o deslocamento do usuário (pan/drag)
    const finalOffset = initialOffset + offsetX

    // Calcular quantas velas são visíveis na tela
    const visibleCandleCount = Math.ceil(width / candleWidth)

    // Atualizar referência
    chartDataRef.current = {
      ...chartDataRef.current,
      width,
      height,
      maxPrice,
      minPrice,
      priceRange: maxPrice - minPrice,
      candleWidth,
      rightPadding: 100,
      initialOffset,
      finalOffset,
      visibleCandleCount,
    }
  }

  const drawChart = (ctx: CanvasRenderingContext2D) => {
    if (klineData.length === 0) return

    const { width, height, maxPrice, minPrice, priceRange, candleWidth, finalOffset } = chartDataRef.current

    ctx.clearRect(0, 0, width, height)

    // Draw grid lines
    ctx.strokeStyle = "#1e2530"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const horizontalLines = 5
    for (let i = 0; i <= horizontalLines; i++) {
      const y = (i / horizontalLines) * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      // Adicionar rótulos de preço
      const price = maxPrice - (i / horizontalLines) * priceRange
      ctx.fillStyle = "#8a8d94"
      ctx.font = "12px Arial"
      ctx.textAlign = "right"
      ctx.fillText(price.toFixed(6), width - 10, y + 4)
    }

    // Vertical grid lines
    const verticalLines = 8
    for (let i = 0; i <= verticalLines; i++) {
      const x = (i / verticalLines) * width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw time labels
    if (klineData.length > 0 && candleWidth > 5) {
      const timeLabels = 5
      for (let i = 0; i <= timeLabels; i++) {
        const index = Math.floor((i / timeLabels) * (klineData.length - 1))
        const x = index * candleWidth + finalOffset

        if (x >= 0 && x <= width) {
          const date = new Date(klineData[index].time)
          const formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          const formattedDate = date.toLocaleDateString([], { month: "short", day: "numeric" })

          ctx.fillStyle = "#8a8d94"
          ctx.font = "10px Arial"
          ctx.textAlign = "center"
          ctx.fillText(formattedTime, x, height - 20)
          ctx.fillText(formattedDate, x, height - 5)
        }
      }
    }

    // Draw candlesticks
    klineData.forEach((candle, i) => {
      const x = i * candleWidth + finalOffset

      // Verificar se a vela está dentro da área visível (com margem para melhor performance)
      if (x + candleWidth < -100 || x > width + 100) return

      // Convert price to y coordinate
      const yHigh = height - ((candle.high - minPrice) / priceRange) * height
      const yLow = height - ((candle.low - minPrice) / priceRange) * height
      const yOpen = height - ((candle.open - minPrice) / priceRange) * height
      const yClose = height - ((candle.close - minPrice) / priceRange) * height

      // Draw wick
      ctx.beginPath()
      ctx.strokeStyle = candle.open > candle.close ? "#ff3b30" : "#34c759"
      ctx.moveTo(x + candleWidth / 2, yHigh)
      ctx.lineTo(x + candleWidth / 2, yLow)
      ctx.stroke()

      // Draw body
      ctx.fillStyle = candle.open > candle.close ? "#ff3b30" : "#34c759"
      ctx.fillRect(x, Math.min(yOpen, yClose), candleWidth, Math.abs(yClose - yOpen))

      // Se esta é a vela sob o mouse, desenhe um contorno
      if (hoveredCandle && hoveredCandle.index === i) {
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.strokeRect(x - 1, Math.min(yOpen, yClose) - 1, candleWidth + 2, Math.abs(yClose - yOpen) + 2)
        ctx.lineWidth = 1
      }
    })

    // Draw high/low markers
    const highCandle = klineData.reduce((prev, current) => (prev.high > current.high ? prev : current))
    const lowCandle = klineData.reduce((prev, current) => (prev.low < current.low ? prev : current))

    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "left"
    ctx.fillText(`High ${highCandle.high.toFixed(6)}`, 10, 20)
    ctx.fillText(`Low ${lowCandle.low.toFixed(6)}`, 10, height - 20)

    // Draw current price line if available
    if (currentPrice) {
      const yCurrentPrice = height - ((currentPrice - minPrice) / priceRange) * height

      ctx.beginPath()
      ctx.strokeStyle = "#ffffff"
      ctx.setLineDash([5, 3])
      ctx.moveTo(0, yCurrentPrice)
      ctx.lineTo(width, yCurrentPrice)
      ctx.stroke()
      ctx.setLineDash([])

      // Price label sem o quadrado branco
      ctx.fillStyle = "#ffffff"
      ctx.textAlign = "right"
      ctx.font = "bold 12px Arial"
      ctx.fillText(currentPrice.toFixed(6), width - 10, yCurrentPrice - 5)
    }

    // Desenhar tooltip para a vela sob o mouse
    if (hoveredCandle) {
      const { x, y, candle } = hoveredCandle
      const date = new Date(candle.time)
      const formattedDate = date.toLocaleString()

      const tooltipWidth = 180
      const tooltipHeight = 120
      const padding = 10

      // Ajustar posição para garantir que o tooltip fique dentro da tela
      let tooltipX = x + 15
      let tooltipY = y - tooltipHeight - 10

      if (tooltipX + tooltipWidth > width) {
        tooltipX = x - tooltipWidth - 15
      }

      if (tooltipY < 0) {
        tooltipY = y + 10
      }

      // Desenhar fundo do tooltip
      ctx.fillStyle = "rgba(30, 37, 48, 0.95)"
      ctx.strokeStyle = "#3a4255"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5)
      ctx.fill()
      ctx.stroke()

      // Desenhar conteúdo do tooltip
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 12px Arial"
      ctx.textAlign = "left"
      ctx.fillText(formattedDate, tooltipX + padding, tooltipY + padding + 12)

      ctx.font = "12px Arial"
      ctx.fillText(`Open: ${candle.open.toFixed(6)}`, tooltipX + padding, tooltipY + padding + 32)
      ctx.fillText(`High: ${candle.high.toFixed(6)}`, tooltipX + padding, tooltipY + padding + 52)
      ctx.fillText(`Low: ${candle.low.toFixed(6)}`, tooltipX + padding, tooltipY + padding + 72)
      ctx.fillText(`Close: ${candle.close.toFixed(6)}`, tooltipX + padding, tooltipY + padding + 92)

      // Indicador de direção
      const directionColor = candle.open > candle.close ? "#ff3b30" : "#34c759"
      ctx.fillStyle = directionColor
      ctx.fillText(
        candle.open > candle.close ? "↓ Bearish" : "↑ Bullish",
        tooltipX + padding + 100,
        tooltipY + padding + 12,
      )
    }
  }

  // Handlers para zoom e pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    // Ajustar o zoom com base na direção da roda do mouse
    const newScale =
      e.deltaY < 0
        ? Math.min(scale + 0.1, 5) // Zoom in (máximo 5x)
        : Math.max(scale - 0.1, 0.5) // Zoom out (mínimo 0.5x)

    setScale(newScale)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Verificar se o mouse está sobre uma vela
    if (klineData.length > 0) {
      const { candleWidth, finalOffset, height, minPrice, priceRange } = chartDataRef.current

      // Encontrar o índice da vela sob o mouse
      const candleIndex = Math.floor((x - finalOffset) / candleWidth)

      if (candleIndex >= 0 && candleIndex < klineData.length) {
        const candle = klineData[candleIndex]
        setHoveredCandle({
          index: candleIndex,
          x,
          y,
          candle,
        })
      } else {
        setHoveredCandle(null)
      }
    }

    if (!isDragging) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    // Atualizar offset horizontal
    setOffsetX((prev) => prev + dx)

    // Atualizar offset vertical (invertido para manter a intuitividade)
    if (Math.abs(dy) > 5) {
      // Pequeno threshold para evitar movimentos acidentais
      setOffsetY((prev) => prev + dy / 50) // Reduzir a sensibilidade vertical
    }

    setDragStart({ x: e.clientX, y: e.clientY })

    // Verificar se estamos próximos da borda esquerda para carregar mais dados
    const { finalOffset } = chartDataRef.current
    if (finalOffset > -100 && !isLoadingMore) {
      handleLoadMoreHistory()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoveredCandle(null)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setIsRefreshing(false)
    // Resetar o offset para mostrar os dados mais recentes
    setOffsetX(0)
    setOffsetY(0)
  }

  const handleMoveLeft = () => {
    // Mover para a esquerda (dados mais antigos)
    const moveAmount = chartDataRef.current.candleWidth * 10
    setOffsetX((prev) => prev + moveAmount)

    // Verificar se precisamos carregar mais dados
    const { finalOffset } = chartDataRef.current
    if (finalOffset + moveAmount > -100 && !isLoadingMore) {
      handleLoadMoreHistory()
    }
  }

  const handleMoveRight = () => {
    // Mover para a direita (dados mais recentes)
    const moveAmount = chartDataRef.current.candleWidth * 10
    setOffsetX((prev) => Math.min(0, prev - moveAmount))
  }

  const handleMoveUp = () => {
    // Mover para cima (preços mais altos)
    setOffsetY((prev) => prev + 1)
  }

  const handleMoveDown = () => {
    // Mover para baixo (preços mais baixos)
    setOffsetY((prev) => prev - 1)
  }

  return (
    <div className="w-full h-full bg-[#0d1117] relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      />

      {/* Controles de zoom e navegação */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="bg-[#131722] border-gray-700 hover:bg-[#1e2530]"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aumentar zoom</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="bg-[#131722] border-gray-700 hover:bg-[#1e2530]"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Diminuir zoom</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="bg-[#131722] border-gray-700 hover:bg-[#1e2530]"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualizar dados</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Controles de navegação horizontal */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-4">
        <Button
          size="icon"
          variant="outline"
          className="bg-[#131722] border-gray-700 hover:bg-[#1e2530] h-10 w-10"
          onClick={handleMoveLeft}
          disabled={isLoadingMore}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="bg-[#131722] border-gray-700 hover:bg-[#1e2530] h-10 w-10"
          onClick={handleMoveRight}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Controles de navegação vertical */}
      <div className="absolute top-1/2 transform -translate-y-1/2 left-4 flex flex-col gap-4">
        <Button
          size="icon"
          variant="outline"
          className="bg-[#131722] border-gray-700 hover:bg-[#1e2530] h-10 w-10"
          onClick={handleMoveUp}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="bg-[#131722] border-gray-700 hover:bg-[#1e2530] h-10 w-10"
          onClick={handleMoveDown}
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Indicador de carregamento */}
      {(isLoading || isLoadingMore) && (
        <div className="absolute top-4 left-4 bg-[#131722] text-white px-3 py-1 rounded-md text-xs flex items-center">
          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
          {isLoading ? "Carregando dados..." : "Carregando histórico..."}
        </div>
      )}
    </div>
  )
}
