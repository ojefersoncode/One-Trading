import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TradingProvider } from "@/components/trading-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Trading Platform",
  description: "IQOption-like trading platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <TradingProvider>{children}</TradingProvider>
      </body>
    </html>
  )
}
