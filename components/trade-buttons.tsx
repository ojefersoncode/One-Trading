"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TradeButtonsProps {
  onTradeUp: () => void
  onTradeDown: () => void
  disabled: boolean
}

export default function TradeButtons({ onTradeUp, onTradeDown, disabled }: TradeButtonsProps) {
  return (
    <div className="flex gap-4 p-4 bg-[#0d1117]">
      <Button
        className="flex-1 bg-[#ff3b30] hover:bg-[#e0352b] text-white py-6 rounded-md disabled:opacity-50"
        onClick={onTradeDown}
        disabled={disabled}
      >
        <div className="flex items-center justify-center">
          <span className="text-lg font-medium mr-2">Abaixo</span>
          <ArrowDown className="h-5 w-5" />
        </div>
      </Button>
      <Button
        className="flex-1 bg-[#34c759] hover:bg-[#2fb350] text-white py-6 rounded-md disabled:opacity-50"
        onClick={onTradeUp}
        disabled={disabled}
      >
        <div className="flex items-center justify-center">
          <span className="text-lg font-medium mr-2">Acima</span>
          <ArrowUp className="h-5 w-5" />
        </div>
      </Button>
    </div>
  )
}
