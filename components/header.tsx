import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  balance: string
}

export default function Header({ balance }: HeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 bg-[#0d1117] border-b border-gray-800">
      <div>
        <div className="flex items-center text-gray-400 text-sm">
          <span>Conta demo</span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
        <div className="text-2xl font-bold">{balance}</div>
      </div>
      <Button className="bg-[#ff6600] hover:bg-[#e65c00] text-white rounded-full px-6">Depositar</Button>
    </div>
  )
}
