"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTradingContext } from "./trading-context"

export default function CryptoSelector() {
  const { availableSymbols, symbol, setSymbol } = useTradingContext()
  const [open, setOpen] = useState(false)

  const selectedCrypto = availableSymbols.find((crypto) => crypto.symbol === symbol)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-[#131722] border-gray-700 text-white hover:bg-[#1e2530] hover:text-white"
        >
          <div className="flex items-center">
            {selectedCrypto?.icon && (
              <img
                src={selectedCrypto.icon || "/placeholder.svg"}
                alt={selectedCrypto.name}
                className="w-5 h-5 mr-2 rounded-full"
              />
            )}
            <span>{selectedCrypto?.name || symbol}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-[#131722] border-gray-700 text-white">
        <Command className="bg-transparent">
          <CommandInput placeholder="Buscar criptomoeda..." className="border-b border-gray-700 text-white" />
          <CommandList>
            <CommandEmpty>Nenhuma criptomoeda encontrada.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {availableSymbols.map((crypto) => (
                <CommandItem
                  key={crypto.symbol}
                  value={crypto.symbol}
                  onSelect={() => {
                    setSymbol(crypto.symbol)
                    setOpen(false)
                  }}
                  className="flex items-center cursor-pointer hover:bg-[#1e2530]"
                >
                  {crypto.icon && (
                    <img
                      src={crypto.icon || "/placeholder.svg"}
                      alt={crypto.name}
                      className="w-5 h-5 mr-2 rounded-full"
                    />
                  )}
                  <span>{crypto.name}</span>
                  <Check className={`ml-auto h-4 w-4 ${symbol === crypto.symbol ? "opacity-100" : "opacity-0"}`} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
