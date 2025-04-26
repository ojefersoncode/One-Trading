"use client"

import { useState } from "react"
import { BarChart2, LayoutGrid, User, Clock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import TradeHistory from "./trade-history"
import AccountSummary from "./account-summary"

export default function BottomNavigation() {
  const [activeTab, setActiveTab] = useState("chart")

  return (
    <div className="flex justify-around items-center p-4 bg-[#0d1117] border-t border-gray-800">
      <Button
        variant="ghost"
        className={`flex flex-col items-center ${activeTab === "chart" ? "text-white" : "text-gray-500"}`}
        onClick={() => setActiveTab("chart")}
      >
        <BarChart2 className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        className={`flex flex-col items-center ${activeTab === "grid" ? "text-white" : "text-gray-500"}`}
        onClick={() => setActiveTab("grid")}
      >
        <LayoutGrid className="h-6 w-6" />
      </Button>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="flex flex-col items-center text-gray-500">
            <Clock className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-[#131722] text-white border-t border-gray-800">
          <TradeHistory />
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="flex flex-col items-center text-gray-500">
            <DollarSign className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="bg-[#131722] text-white border-t border-gray-800">
          <AccountSummary />
        </SheetContent>
      </Sheet>

      <Button
        variant="ghost"
        className={`flex flex-col items-center ${activeTab === "user" ? "text-white" : "text-gray-500"}`}
        onClick={() => setActiveTab("user")}
      >
        <User className="h-6 w-6" />
      </Button>
    </div>
  )
}
