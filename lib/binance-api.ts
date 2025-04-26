// Funções para interagir com a API pública da Binance

// Cache para armazenar dados temporariamente e reduzir chamadas à API
const cache = {
  klineData: new Map<string, { data: any[]; timestamp: number }>(),
  prices: new Map<string, { price: number; timestamp: number }>(),
}

// Tempo de expiração do cache em milissegundos
const CACHE_EXPIRY = {
  PRICE: 2000, // 2 segundos para preços
  KLINE: 15000, // 15 segundos para klines
}

// Obter dados de klines (candlesticks)
export async function getKlineData(symbol: string, interval: string, limit = 100, endTime?: number) {
  try {
    // Gerar chave de cache
    const cacheKey = `${symbol}-${interval}-${limit}-${endTime || "latest"}`

    // Verificar se temos dados em cache válidos
    const cachedData = cache.klineData.get(cacheKey)
    const now = Date.now()

    if (cachedData && now - cachedData.timestamp < CACHE_EXPIRY.KLINE) {
      console.log("Usando dados de kline em cache para", cacheKey)
      return cachedData.data
    }

    // Se não temos cache válido, buscar da API
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`

    // Se temos um timestamp de fim, adicionar à URL
    if (endTime) {
      url += `&endTime=${endTime}`
    }

    console.log("Buscando klines da API para", cacheKey)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status}`)
    }

    const data = await response.json()

    // Formatar dados para o formato que precisamos
    const formattedData = data.map((item: any) => ({
      time: item[0],
      open: Number.parseFloat(item[1]),
      high: Number.parseFloat(item[2]),
      low: Number.parseFloat(item[3]),
      close: Number.parseFloat(item[4]),
      volume: Number.parseFloat(item[5]),
    }))

    // Armazenar em cache
    cache.klineData.set(cacheKey, { data: formattedData, timestamp: now })

    return formattedData
  } catch (error) {
    console.error("Erro ao buscar dados da Binance:", error)

    // Em caso de erro, tentar usar cache mesmo que expirado
    const cacheKey = `${symbol}-${interval}-${limit}-${endTime || "latest"}`
    const cachedData = cache.klineData.get(cacheKey)
    if (cachedData) {
      console.log("Usando cache expirado devido a erro na API")
      return cachedData.data
    }

    return []
  }
}

// Obter preço atual de um símbolo
export async function getCurrentPrice(symbol: string) {
  try {
    // Verificar se temos preço em cache válido
    const cachedPrice = cache.prices.get(symbol)
    const now = Date.now()

    if (cachedPrice && now - cachedPrice.timestamp < CACHE_EXPIRY.PRICE) {
      return cachedPrice.price
    }

    // Se não temos cache válido, buscar da API
    console.log("Buscando preço atual da API para", symbol)
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)

    if (!response.ok) {
      throw new Error(`Erro ao buscar preço: ${response.status}`)
    }

    const data = await response.json()
    const price = Number.parseFloat(data.price)

    // Armazenar em cache
    cache.prices.set(symbol, { price, timestamp: now })

    return price
  } catch (error) {
    console.error("Erro ao buscar preço atual:", error)

    // Em caso de erro, tentar usar cache mesmo que expirado
    const cachedPrice = cache.prices.get(symbol)
    if (cachedPrice) {
      console.log("Usando cache de preço expirado devido a erro na API")
      return cachedPrice.price
    }

    return null
  }
}

// Obter múltiplos preços de uma vez (mais eficiente)
export async function getMultiplePrices(symbols: string[]) {
  try {
    if (symbols.length === 0) return new Map<string, number>()

    // Filtrar apenas símbolos que precisam ser atualizados
    const now = Date.now()
    const symbolsToFetch = symbols.filter((symbol) => {
      const cachedPrice = cache.prices.get(symbol)
      return !cachedPrice || now - cachedPrice.timestamp >= CACHE_EXPIRY.PRICE
    })

    if (symbolsToFetch.length === 0) {
      // Todos os símbolos têm cache válido
      const result = new Map<string, number>()
      symbols.forEach((symbol) => {
        const cachedPrice = cache.prices.get(symbol)
        if (cachedPrice) result.set(symbol, cachedPrice.price)
      })
      return result
    }

    // Buscar preços da API
    console.log("Buscando múltiplos preços da API:", symbolsToFetch.join(", "))
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price`)

    if (!response.ok) {
      throw new Error(`Erro ao buscar preços: ${response.status}`)
    }

    const data = await response.json()
    const result = new Map<string, number>()

    // Processar resultados e atualizar cache
    data.forEach((item: any) => {
      if (symbols.includes(item.symbol)) {
        const price = Number.parseFloat(item.price)
        result.set(item.symbol, price)
        cache.prices.set(item.symbol, { price, timestamp: now })
      }
    })

    // Adicionar preços em cache para símbolos que não foram atualizados
    symbols.forEach((symbol) => {
      if (!result.has(symbol)) {
        const cachedPrice = cache.prices.get(symbol)
        if (cachedPrice) result.set(symbol, cachedPrice.price)
      }
    })

    return result
  } catch (error) {
    console.error("Erro ao buscar múltiplos preços:", error)

    // Em caso de erro, usar cache mesmo que expirado
    const result = new Map<string, number>()
    symbols.forEach((symbol) => {
      const cachedPrice = cache.prices.get(symbol)
      if (cachedPrice) result.set(symbol, cachedPrice.price)
    })

    return result
  }
}

// Atualizar a última vela do klineData com o preço atual
export function updateLastCandle(klineData: any[], currentPrice: number) {
  if (klineData.length === 0) return klineData

  const lastCandle = { ...klineData[klineData.length - 1] }

  // Atualizar o preço de fechamento
  lastCandle.close = currentPrice

  // Atualizar máximo e mínimo se necessário
  if (currentPrice > lastCandle.high) {
    lastCandle.high = currentPrice
  }
  if (currentPrice < lastCandle.low) {
    lastCandle.low = currentPrice
  }

  // Criar novo array para manter imutabilidade
  const updatedData = [...klineData]
  updatedData[updatedData.length - 1] = lastCandle

  return updatedData
}

// Limpar cache
export function clearCache() {
  cache.klineData.clear()
  cache.prices.clear()
  console.log("Cache limpo")
}

// Mapear intervalos de tempo para o formato da Binance
export const timeFrameMap: Record<string, string> = {
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "1d": "1d",
  "1M": "1M",
  ALL: "1w", // Usamos 1 semana como substituto para "ALL"
}

// Lista de símbolos disponíveis para trading com ícones
export const availableSymbols = [
  {
    symbol: "BTCUSDT",
    name: "Bitcoin/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=026",
  },
  {
    symbol: "ETHUSDT",
    name: "Ethereum/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026",
  },
  {
    symbol: "BNBUSDT",
    name: "Binance Coin/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.png?v=026",
  },
  {
    symbol: "ADAUSDT",
    name: "Cardano/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/cardano-ada-logo.png?v=026",
  },
  {
    symbol: "DOGEUSDT",
    name: "Dogecoin/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/dogecoin-doge-logo.png?v=026",
  },
  {
    symbol: "XRPUSDT",
    name: "Ripple/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/xrp-xrp-logo.png?v=026",
  },
  {
    symbol: "SOLUSDT",
    name: "Solana/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/solana-sol-logo.png?v=026",
  },
  {
    symbol: "DOTUSDT",
    name: "Polkadot/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/polkadot-new-dot-logo.png?v=026",
  },
  {
    symbol: "MATICUSDT",
    name: "Polygon/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=026",
  },
  {
    symbol: "LTCUSDT",
    name: "Litecoin/USDT",
    category: "Crypto",
    icon: "https://cryptologos.cc/logos/litecoin-ltc-logo.png?v=026",
  },
]
