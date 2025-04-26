"use client"
import Header from "./header"
import TradingPair from "./trading-pair"
import ExpectedReturn from "./expected-return"
import Chart from "./chart"
import TimeFrameSelector from "./time-frame-selector"
import TradeButtons from "./trade-buttons"
import TradeControls from "./trade-controls"
import BottomNavigation from "./bottom-navigation"
import TradeNotification from "./trade-notification"
import ActiveTradeIndicator from "./active-trade-indicator"
import CryptoSelector from "./crypto-selector"
import { useTradingContext } from "./trading-context"
import { formatCurrency } from "@/lib/trading-simulator"
import { Loader2 } from "lucide-react"

export default function TradingView() {
  const {
    balance,
    symbol,
    timeFrame,
    tradeAmount,
    selectedTime,
    expectedReturn,
    activeTrade,
    isLoading,
    currentPrice,
    getSymbolInfo,
    setTimeFrame,
    setTradeAmount,
    setSelectedTime,
    placeTrade,
  } = useTradingContext()

  const symbolInfo = getSymbolInfo(symbol)

  return (
    <div className="flex flex-col h-screen">
      <Header balance={formatCurrency(balance)} />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 bg-[#0d1117] border-b border-gray-800">
          <CryptoSelector />
        </div>
        <TradingPair
          icon={symbolInfo?.icon || "/crypto-icon.png"}
          name={symbolInfo?.name || symbol}
          category={symbolInfo?.category || "Crypto"}
        />
        <ExpectedReturn amount={expectedReturn.amount} percentage={expectedReturn.percentage} />
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          <Chart />
          <ActiveTradeIndicator />
        </div>
        <TimeFrameSelector activeTimeFrame={timeFrame} setActiveTimeFrame={setTimeFrame} />
        <TradeButtons
          onTradeUp={() => placeTrade("up")}
          onTradeDown={() => placeTrade("down")}
          disabled={!!activeTrade || tradeAmount > balance}
        />
        <TradeControls time={selectedTime} setTime={setSelectedTime} amount={tradeAmount} setAmount={setTradeAmount} />
      </div>
      <BottomNavigation />
      <TradeNotification />
    </div>
  )
}
