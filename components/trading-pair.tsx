import { X, Plus } from "lucide-react"

interface TradingPairProps {
  icon: string
  name: string
  category: string
}

export default function TradingPair({ icon, name, category }: TradingPairProps) {
  return (
    <div className="flex justify-between items-center p-3 bg-[#131722] border-b border-gray-800">
      <div className="flex items-center">
        <div className="relative w-10 h-10 mr-3 flex-shrink-0">
          <div className="absolute inset-0 bg-[#ff6600] rounded-full flex items-center justify-center text-xs font-bold">
            OTC
          </div>
        </div>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-400">{category}</div>
        </div>
      </div>
      <div className="flex items-center">
        <button className="p-2 text-gray-400">
          <X className="h-5 w-5" />
        </button>
        <button className="p-2 text-gray-400">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
