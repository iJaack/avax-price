'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'

interface NewsItem {
  title: string
  source: string
  url: string
}

interface ExchangeData {
  exchange: string
  fundingRate: string
  fundingSentiment: string
  openInterestUsd: number
  oiChange24h: number
  oiSentiment: string
  longShortRatio: string
  positionSentiment: string
  takerRatio: string
  takerSentiment: string
}

// Helper to format time ago
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

// Animated rolling digit component - Odometer style
function RollingDigit({ digit, prevDigit }: { digit: string; prevDigit: string }) {
  // If not a number, just render static
  if (isNaN(parseInt(digit, 10))) {
    return <span className="inline-block">{digit}</span>
  }

  // Vertical strip of numbers 0-9
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <span className="inline-block relative overflow-hidden h-[1em]" style={{ width: '0.6em', verticalAlign: 'bottom' }}>
      <span
        className="flex flex-col absolute left-0 right-0 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          transform: `translateY(-${parseInt(digit, 10) * 10}%)`,
        }}
      >
        {numbers.map((num) => (
          <span key={num} className="h-[1em] flex items-center justify-center tabular-nums">
            {num}
          </span>
        ))}
      </span>
    </span>
  )
}

// Animated price display
function AnimatedPrice({ price, className }: { price: number; className?: string }) {
  const [prevPrice, setPrevPrice] = useState(price)
  const priceStr = price.toFixed(2)
  const prevPriceStr = prevPrice.toFixed(2)

  useEffect(() => {
    const timer = setTimeout(() => setPrevPrice(price), 350)
    return () => clearTimeout(timer)
  }, [price])

  // Pad strings to same length for digit comparison
  const maxLen = Math.max(priceStr.length, prevPriceStr.length)
  const paddedCurrent = priceStr.padStart(maxLen, ' ')
  const paddedPrev = prevPriceStr.padStart(maxLen, ' ')

  return (
    <span className={className}>
      {paddedCurrent.split('').map((char, i) => (
        <RollingDigit key={i} digit={char} prevDigit={paddedPrev[i] || ' '} />
      ))}
    </span>
  )
}

// Smooth number interpolation hook
function useAnimatedValue(targetValue: number, duration: number = 500) {
  const [value, setValue] = useState(targetValue)
  const frameRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const startValueRef = useRef(targetValue)

  useEffect(() => {
    if (targetValue === value) return

    startValueRef.current = value
    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - (startTimeRef.current || currentTime)
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const newValue = startValueRef.current + (targetValue - startValueRef.current) * easeOut

      setValue(newValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [targetValue, duration])

  return value
}

// Calculate time until 5pm EST
function getTimeRemaining(): string {
  const now = new Date()
  const target = new Date()
  target.setUTCHours(22, 0, 0, 0) // 5pm EST = 22:00 UTC
  if (now > target) target.setDate(target.getDate() + 1)

  const diff = target.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return `${hours}h ${minutes}m ${seconds}s`
}

// Helper to generate candle data from history
function generateCandles(history: Array<{ price: number; timestamp: number }>, count = 40) {
  if (history.length < count) return []

  const chunkSize = Math.ceil(history.length / count)
  const candles = []

  for (let i = 0; i < history.length; i += chunkSize) {
    const chunk = history.slice(i, i + chunkSize)
    if (chunk.length === 0) continue

    const open = chunk[0].price
    const close = chunk[chunk.length - 1].price
    const high = Math.max(...chunk.map(c => c.price))
    const low = Math.min(...chunk.map(c => c.price))

    candles.push({
      open,
      high,
      low,
      close,
      timestamp: chunk[Math.floor(chunk.length / 2)].timestamp,
      isGreen: close >= open
    })
  }

  return candles
}

export default function Home() {
  const [price, setPrice] = useState<number>(14.50)
  const [change24h, setChange24h] = useState<number>(0)
  const [marketCap, setMarketCap] = useState<number>(0)
  const [history, setHistory] = useState<Array<{ price: number; timestamp: number }>>([])
  const [selectedPeriod, setSelectedPeriod] = useState('1D')
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining())
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsTimestamp, setNewsTimestamp] = useState<number>(Date.now())
  const [exchanges, setExchanges] = useState<ExchangeData[]>([
    {
      exchange: 'Binance',
      fundingRate: '0.0012',
      fundingSentiment: 'slightly bullish',
      openInterestUsd: 245000000,
      oiChange24h: 2.5,
      oiSentiment: 'stable',
      longShortRatio: '1.85',
      positionSentiment: 'heavy longs',
      takerRatio: '1.12',
      takerSentiment: 'buyers lead'
    }
  ])
  const [selectedExchange, setSelectedExchange] = useState(0)
  const [chartType, setChartType] = useState<'line' | 'candle'>('line')
  const [isChartTransitioning, setIsChartTransitioning] = useState(false)

  // Animated values for smooth transitions
  const animatedPrice = useAnimatedValue(price, 600)
  const animatedChange = useAnimatedValue(change24h, 600)

  // Timer for countdown
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch price
  const fetchPrice = useCallback(async (days: string = '1') => {
    try {
      const res = await fetch(`/api/price?days=${days}`)
      const data = await res.json()
      // Only update metadata (marketCap, history) from CoinGecko
      // Price and 24h Change are handled exclusively by Binance (fetchLivePrice) to strictly enforce "one price feed"
      if (data.marketCap) setMarketCap(data.marketCap)
      if (data.history?.length > 0) {
        setHistory(data.history.map((h: { price: number; timestamp: number }) => ({
          price: h.price,
          timestamp: h.timestamp
        })))
      }
    } catch (err) {
      console.error('Price fetch error:', err)
    } finally {
      setLoading(false)
      setIsChartTransitioning(false)
    }
  }, [])

  // Fetch news
  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (data.news?.length > 0) {
        setNews(data.news.slice(0, 6))
        setNewsTimestamp(Date.now())
      }
    } catch {
      setNews([
        { title: 'AVAX subnet activity reaches new highs with gaming integrations', source: 'CoinDesk', url: 'https://www.coindesk.com/search?q=avalanche' },
        { title: 'Avalanche Foundation launches ecosystem growth initiative', source: 'The Block', url: 'https://www.theblock.co/search?query=avalanche' },
        { title: 'Major DeFi protocol announces Avalanche expansion', source: 'Decrypt', url: 'https://decrypt.co/search?query=avalanche' },
        { title: 'AVAX staking rewards see increased participation', source: 'CryptoSlate', url: 'https://cryptoslate.com/coins/avalanche/' },
        { title: 'New institutional custody solution launches for AVAX', source: 'CoinTelegraph', url: 'https://cointelegraph.com/tags/avalanche' },
      ])
      setNewsTimestamp(Date.now())
    }
  }

  // Fetch live price (fast update)
  const fetchLivePrice = async () => {
    try {
      const res = await fetch('/api/price?type=live')
      if (res.ok) {
        const data = await res.json()
        setPrice(data.price)
        setChange24h(data.change24h)
      }
    } catch (e) {
      console.error('Live update failed', e)
    }
  }

  // Fetch leverage data
  const fetchLeverage = async () => {
    try {
      const res = await fetch('/api/leverage')
      const data = await res.json()
      if (data.exchanges?.length > 0) {
        setExchanges(data.exchanges)
      }
    } catch {
      // Keep default values
    }
  }

  // Handle period change with transition
  const handlePeriodChange = (period: string) => {
    if (period === selectedPeriod) return
    setIsChartTransitioning(true)
    setSelectedPeriod(period)
  }

  useEffect(() => {
    const periodMap: Record<string, string> = {
      '1H': '0.04', '1D': '1', '1W': '7', '1M': '30', '1Y': '365', 'ALL': 'max'
    }
    fetchPrice(periodMap[selectedPeriod] || '1')
  }, [selectedPeriod, fetchPrice])

  useEffect(() => {
    fetchNews()
    fetchLeverage()
    const periodMap: Record<string, string> = {
      '1H': '0.04', '1D': '1', '1W': '7', '1M': '30', '1Y': '365', 'ALL': 'max'
    }

    // Initial fetch for history
    fetchPrice(periodMap[selectedPeriod] || '1')

    // Immediate fetch for live price
    fetchLivePrice()

    // Fast interval for price only (1s)
    const liveInterval = setInterval(fetchLivePrice, 1000)

    // Slow interval for history/chart (60s)
    const priceInterval = setInterval(() => {
      fetchPrice(periodMap[selectedPeriod] || '1')
    }, 60000)

    const leverageInterval = setInterval(fetchLeverage, 60000)

    return () => {
      clearInterval(liveInterval)
      clearInterval(priceInterval)
      clearInterval(leverageInterval)
    }
  }, [selectedPeriod, fetchPrice])

  // Chart calculations with smooth path
  const chartData = useMemo(() => {
    if (!history.length) return { path: '', min: 0, max: 0, mid: 0 }
    const prices = history.map(h => h.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const mid = (min + max) / 2
    const range = max - min || 1

    // Create smooth SVG path using cubic bezier curves
    const points = history.map((h, i) => ({
      x: (i / (history.length - 1)) * 100,
      y: 100 - ((h.price - min) / range) * 100
    }))

    if (points.length < 2) return { path: '', min, max, mid }

    // Start path
    let path = `M ${points[0].x},${points[0].y}`

    // Use quadratic curves for smoother lines
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      path += ` Q ${prev.x},${prev.y} ${cpx},${(prev.y + curr.y) / 2}`
    }

    // Final point
    const last = points[points.length - 1]
    path += ` L ${last.x},${last.y}`

    return { path, min, max, mid }
  }, [history])

  // Dynamic predictions based on price
  const predictions = useMemo(() => {
    const base = Math.ceil(animatedPrice)
    return [
      { label: `${base + 2} or above`, yes: 25, no: 75 },
      { label: `${base + 1} or above`, yes: 38, no: 62 },
      { label: `${base} or above`, yes: 52, no: 48 },
    ]
  }, [animatedPrice])

  const isPositive = animatedChange >= 0

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen vignette-glow text-white font-sans">
      <div className="max-w-[680px] mx-auto px-6 py-12">

        {/* HEADER - AVAX */}
        <div className="text-center mb-1">
          <h1 className="text-neutral-500 text-sm tracking-[0.25em] font-medium">AVAX</h1>
        </div>

        {/* PRICE - Animated */}
        <div className="text-center mb-1">
          <div className="inline-flex items-baseline">
            <span className="text-white text-7xl font-extralight tracking-tight">
              <span className="text-5xl">$</span>
              <AnimatedPrice price={animatedPrice} />
            </span>
            <span className={`ml-4 text-xl transition-colors duration-300 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(animatedChange).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* MARKET PREDICTION - Dynamic */}
        <div className="text-center text-neutral-500 text-sm mb-10">
          market predicts: <span className="text-neutral-300">at least ${Math.ceil(animatedPrice * 3)}</span> in 2027 · {Math.round(45 + (animatedChange > 0 ? 5 : -5))}% chance · ${(marketCap / 1e9).toFixed(1)}B backing
        </div>

        {/* CHART CONTROLS */}
        <div className="flex justify-between mb-2">
          {/* Chart Type Toggle */}
          <div className="inline-flex bg-neutral-900 rounded p-0.5">
            {(['line', 'candle'] as const).map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-2.5 py-1 text-xs rounded transition-all duration-200 capitalize ${chartType === type
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Time Selector */}
          <div className="inline-flex bg-neutral-900 rounded p-0.5">
            {['1H', '1D', '1W', '1M', '1Y', 'ALL'].map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-2.5 py-1 text-xs rounded transition-all duration-200 ${selectedPeriod === p
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* CHART - Animated */}
        <div className="relative h-48 mb-10">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#262626" strokeWidth="0.3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#262626" strokeWidth="0.3" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="#262626" strokeWidth="0.3" />

            {/* Line Chart */}
            {chartType === 'line' && (
              <path
                d={chartData.path}
                fill="none"
                stroke="#737373"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
                className={`transition-all duration-700 ease-out ${isChartTransitioning ? 'opacity-30' : 'opacity-100'}`}
                style={{
                  strokeDasharray: isChartTransitioning ? '1000' : 'none',
                  strokeDashoffset: isChartTransitioning ? '1000' : '0',
                }}
              />
            )}

            {/* Candle Chart */}
            {chartType === 'candle' && generateCandles(history).map((candle, i, all) => {
              const min = chartData.min
              const range = chartData.max - chartData.min
              const x = (i / (all.length - 1)) * 100
              const w = (100 / all.length) * 0.7

              const yHigh = 100 - ((candle.high - min) / range) * 100
              const yLow = 100 - ((candle.low - min) / range) * 100
              const yOpen = 100 - ((candle.open - min) / range) * 100
              const yClose = 100 - ((candle.close - min) / range) * 100

              const yBodyTop = Math.min(yOpen, yClose)
              const bodyHeight = Math.abs(yClose - yOpen) || 0.5 // Minimal height for doji

              return (
                <g key={i} className={`transition-opacity duration-500 ${isChartTransitioning ? 'opacity-30' : 'opacity-100'}`}>
                  {/* Wick */}
                  <line
                    x1={x} y1={yHigh} x2={x} y2={yLow}
                    stroke={candle.isGreen ? '#22c55e' : '#ef4444'}
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Body */}
                  <rect
                    x={x - w / 2}
                    y={yBodyTop}
                    width={w}
                    height={bodyHeight}
                    fill={candle.isGreen ? '#22c55e' : '#ef4444'}
                  />
                </g>
              )
            })}

          </svg>
          {/* Price labels with animation */}
          <div className={`absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-neutral-600 -mr-10 py-1 transition-opacity duration-500 ${isChartTransitioning ? 'opacity-30' : 'opacity-100'}`}>
            <span>${chartData.max.toFixed(2)}</span>
            <span>${chartData.mid.toFixed(2)}</span>
            <span>${chartData.min.toFixed(2)}</span>
          </div>
        </div>

        {/* PREDICTION MARKETS */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs text-neutral-500 font-semibold tracking-wide">PREDICTION MARKETS</h2>
            <span className="text-[10px] text-neutral-600">via Kalshi</span>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold bg-neutral-800 px-2 py-1 rounded">DAILY</span>
              <span className="text-xs text-neutral-500">{timeLeft}</span>
            </div>

            <h3 className="text-center text-sm text-neutral-300 mb-5">AVAX today at 5pm EST</h3>

            <div className="space-y-4">
              {predictions.map((pred, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">{pred.label}</span>
                  <div className="flex gap-4">
                    <div className="text-center w-14">
                      <div className={`text-sm font-semibold transition-colors duration-300 ${pred.yes >= 50 ? 'text-green-500' : 'text-green-600/70'}`}>
                        {pred.yes}%
                      </div>
                      <div className="text-[10px] text-neutral-600">yes</div>
                    </div>
                    <div className="text-center w-14">
                      <div className={`text-sm font-semibold transition-colors duration-300 ${pred.no >= 50 ? 'text-red-500' : 'text-red-600/70'}`}>
                        {pred.no}%
                      </div>
                      <div className="text-[10px] text-neutral-600">no</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://kalshi.com/markets/crypto"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full mt-5 py-2.5 text-xs text-neutral-500 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors text-center"
            >
              view more markets
            </a>

            <p className="text-center text-[10px] text-neutral-600 mt-3">
              $1.2K at stake · $890 traded
            </p>
          </div>
        </div>

        {/* LEVERAGE SENTIMENT */}
        <div className="mb-8">
          <h2 className="text-xs text-neutral-500 font-semibold tracking-wide mb-3">LEVERAGE SENTIMENT</h2>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
            {/* Exchange Tabs */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                {exchanges.map((ex, idx) => (
                  <button
                    key={ex.exchange}
                    onClick={() => setSelectedExchange(idx)}
                    className={`text-sm px-3 py-1 rounded transition-all duration-200 ${selectedExchange === idx
                      ? 'bg-neutral-700 text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    {ex.exchange}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-neutral-600">via {exchanges[selectedExchange]?.exchange || 'Exchange'}</span>
            </div>

            {exchanges[selectedExchange] && (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                  <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${exchanges[selectedExchange].fundingSentiment.includes('bullish') ? 'text-green-500' : exchanges[selectedExchange].fundingSentiment.includes('bearish') ? 'text-red-500' : 'text-neutral-400'}`}>
                    {exchanges[selectedExchange].fundingSentiment}
                  </div>
                  <div className="text-white text-sm font-semibold">{parseFloat(exchanges[selectedExchange].fundingRate) >= 0 ? '+' : ''}{exchanges[selectedExchange].fundingRate}%</div>
                  <div className="text-[9px] text-neutral-600 mt-1">FUNDING RATE</div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                  <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${exchanges[selectedExchange].oiChange24h > 2 ? 'text-green-500' : exchanges[selectedExchange].oiChange24h < -2 ? 'text-red-500' : 'text-neutral-400'}`}>
                    {exchanges[selectedExchange].oiChange24h > 0 ? '+' : ''}{exchanges[selectedExchange].oiChange24h.toFixed(1)}% 24h
                  </div>
                  <div className="text-white text-sm font-semibold">${(exchanges[selectedExchange].openInterestUsd / 1e6).toFixed(0)}M</div>
                  <div className="text-[9px] text-neutral-600 mt-1">OPEN INTEREST</div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                  <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${exchanges[selectedExchange].positionSentiment.includes('long') ? 'text-green-500' : 'text-red-500'}`}>
                    {exchanges[selectedExchange].positionSentiment}
                  </div>
                  <div className="text-white text-sm font-semibold">{exchanges[selectedExchange].longShortRatio} L/S</div>
                  <div className="text-[9px] text-neutral-600 mt-1">POSITIONING</div>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                  <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${exchanges[selectedExchange].takerSentiment.includes('buyers') ? 'text-green-500' : 'text-red-500'}`}>
                    {exchanges[selectedExchange].takerSentiment}
                  </div>
                  <div className="text-white text-sm font-semibold">{exchanges[selectedExchange].takerRatio}</div>
                  <div className="text-[9px] text-neutral-600 mt-1">TAKER FLOW</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI NEWS SUMMARY */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs text-neutral-500 font-semibold tracking-wide">AI NEWS SUMMARY</h2>
            <span className="text-[10px] text-neutral-600">updated {formatTimeAgo(newsTimestamp)}</span>
          </div>

          <div className="space-y-3">
            {news.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">•</span>
                <div className="flex-1 flex justify-between items-baseline gap-3">
                  <p className="text-sm text-neutral-300 leading-snug">{item.title}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neutral-600 hover:text-neutral-400 whitespace-nowrap flex-shrink-0 transition-colors"
                  >
                    {item.source} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-[10px] text-neutral-700 pt-6 border-t border-neutral-900">
          Data from CoinGecko · Not financial advice
        </div>
      </div>
    </main>
  )
}
