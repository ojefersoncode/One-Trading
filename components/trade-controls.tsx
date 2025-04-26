"use client"

import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TradeControlsProps {
  time: number
  setTime: (time: number) => void
  amount: number
  setAmount: (amount: number) => void
}

export default function TradeControls({ time, setTime, amount, setAmount }: TradeControlsProps) {
  const handleIncreaseAmount = () => {
    setAmount(amount + 100)
  }

  const handleDecreaseAmount = () => {
    if (amount > 100) {
      setAmount(amount - 100)
    }
  }

  const handleIncreaseTime = () => {
    const times = [1, 3, 5, 10, 15, 30, 60]
    const currentIndex = times.indexOf(time)
    if (currentIndex < times.length - 1) {
      setTime(times[currentIndex + 1])
    }
  }

  const handleDecreaseTime = () => {
    const times = [1, 3, 5, 10, 15, 30, 60]
    const currentIndex = times.indexOf(time)
    if (currentIndex > 0) {
      setTime(times[currentIndex - 1])
    }
  }

  return (
    <div className="p-4 bg-[#0d1117] border-t border-gray-800">
      <div className="flex justify-between mb-2">
        <div className="text-center flex-1 text-gray-400">Cronômetro</div>
        <div className="text-center flex-1 text-gray-400">Valor ($)</div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 bg-[#131722] rounded-md flex items-center">
          <Button variant="ghost" className="text-gray-400" onClick={handleDecreaseTime}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-center text-lg">{time}m</div>
          <Button variant="ghost" className="text-gray-400" onClick={handleIncreaseTime}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex-1 bg-[#131722] rounded-md flex items-center">
          <Button variant="ghost" className="text-gray-400" onClick={handleDecreaseAmount}>
            <Minus className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-center text-lg">{amount.toLocaleString()}</div>
          <Button variant="ghost" className="text-gray-400" onClick={handleIncreaseAmount}>
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
