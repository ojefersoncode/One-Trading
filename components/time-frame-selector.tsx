"use client"

import { Button } from "@/components/ui/button"

interface TimeFrameSelectorProps {
  activeTimeFrame: string
  setActiveTimeFrame: (timeFrame: string) => void
}

export default function TimeFrameSelector({ activeTimeFrame, setActiveTimeFrame }: TimeFrameSelectorProps) {
  const timeFrames = ["ALL", "1M", "30m", "15m", "5m"]

  return (
    <div className="flex justify-center items-center p-2 bg-[#0d1117] border-t border-gray-800">
      {timeFrames.map((timeFrame) => (
        <Button
          key={timeFrame}
          variant="ghost"
          className={`px-4 py-1 mx-1 rounded-md ${activeTimeFrame === timeFrame ? "text-white" : "text-gray-500"}`}
          onClick={() => setActiveTimeFrame(timeFrame)}
        >
          {timeFrame}
        </Button>
      ))}
    </div>
  )
}
