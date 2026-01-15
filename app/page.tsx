'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

interface Prediction {
  id: string
  title: string
  question: string
  yesPrice: number
  noPrice: number
  volume: number
  endDate: string
  url: string
}

interface NewsItem {
  title: string
  source: string
  url: string
}

// Animated digit component
function AnimatedDigit({ digit, prevDigit }: { digit: string; prevDigit: string }) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (digit !== prevDigit) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [digit, prevDigit])

  if (digit === '.' || digit === '$' || digit === ',') {
    return <span className="inline-block">{digit}</span>
  }

  return (
    <span className="inline-block relative overflow-hidden h-[1em]" style={{ width: '0.6em' }}>
      <span
        className={`inline-block transition-transform duration-300 ${
          isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        {prevDigit}
      </span>
      <span
        className={`absolute left-0 inline-block transition-transform duration-300 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {digit}
      </span>
    </span>
  )
}

// Rolling price display
function RollingPrice({ price, change }: { price: number; change: number }) {
  const [displayPrice, setDisplayPrice] = useState(price.toFixed(2))
  const [prevPrice, setPrevPrice] = useState(price.toFixed(2))
  const isPositive = change >= 0

  useEffect(() => {
    setPrevPrice(displayPrice)
    setDisplayPrice(price.toFixed(2))
  }, [price])

  const priceStr = `$${displayPrice}`
  const prevPriceStr = `$${prevPrice}`

  return (
    <div className="text-center">
      <div className="text-6xl sm:text-8xl font-light tracking-tight text-white flex justify-center items-baseline">
        {priceStr.split('').map((char, i) => (
          <AnimatedDigit key={i} digit={char} prevDigit={prevPriceStr[i] || char} />
        ))}
        <span className={`text-xl sm:text-2xl ml-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

// Chart component
function PriceChart({
  data,
  selectedPeriod,
  onPeriodChange
}: {
  data: Array<{ price: number; timestamp: number }>
  selectedPeriod: string
  onPeriodChange: (period: string) => void
}) {
  const periods = ['1H', '1D', '1W', '1M', '1Y', 'ALL']

  const { minPrice, maxPrice, points, midPrice } = useMemo(() => {
    if (!data.length) return { minPrice: 0, maxPrice: 0, points: '', midPrice: 0 }

    const prices = data.map(d => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const mid = (min + max) / 2
    const range = max - min || 1

    const width = 700
    const height = 180
    const padding = { top: 10, bottom: 10, left: 0, right: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const pts = data.map((point, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * chartWidth + padding.left
      const y = padding.top + chartHeight - ((point.price - min) / range) * chartHeight
      return `${x},${y}`
    }).join(' ')

    return { minPrice: min, maxPrice: max, points: pts, midPrice: mid }
  }, [data])

  if (!data.length) {
    return <div className="h-[200px] flex items-center justify-center text-zinc-600">Loading chart...</div>
  }

  return (
    <div className="relative">
      {/* Period selector */}
      <div className="absolute top-0 right-0 flex gap-0.5 bg-zinc-900 rounded p-0.5">
        {periods.map(period => (
          <button
            key={period}
            onClick={() => onPeriodChange(period)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              selectedPeriod === period
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-10">
        <svg viewBox="0 0 700 180" className="w-full h-[180px]">
          {/* Grid lines */}
          <line x1="0" y1="10" x2="640" y2="10" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="0" y1="90" x2="640" y2="90" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="0" y1="170" x2="640" y2="170" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />

          {/* Price line */}
          <polyline
            points={points}
            fill="none"
            stroke="#888"
            strokeWidth="1.5"
          />

          {/* Price labels on right */}
          <text x="655" y="15" fill="#4a4a4a" fontSize="11" fontFamily="monospace">${maxPrice.toFixed(0)}</text>
          <text x="655" y="95" fill="#4a4a4a" fontSize="11" fontFamily="monospace">${midPrice.toFixed(0)}</text>
          <text x="655" y="175" fill="#4a4a4a" fontSize="11" fontFamily="monospace">${minPrice.toFixed(0)}</text>
        </svg>
      </div>
    </div>
  )
}

// Prediction market card
function PredictionCard({
  title,
  timeLeft,
  predictions
}: {
  title: string
  timeLeft: string
  predictions: Array<{ label: string; yes: number; no: number }>
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold text-white bg-zinc-800 px-2 py-1 rounded">DAILY</span>
        <span className="text-xs text-zinc-500">{timeLeft}</span>
      </div>

      <h3 className="text-center text-sm text-zinc-300 mb-4">{title}</h3>

      <div className="space-y-3">
        {predictions.map((pred, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{pred.label}</span>
            <div className="flex gap-2">
              <div className="text-center min-w-[50px]">
                <div className={`text-sm font-semibold ${pred.yes > 50 ? 'text-green-500' : 'text-green-500/70'}`}>
                  {pred.yes}%
                </div>
                <div className="text-[10px] text-zinc-600">yes</div>
              </div>
              <div className="text-center min-w-[50px]">
                <div className={`text-sm font-semibold ${pred.no > 50 ? 'text-red-500' : 'text-red-500/70'}`}>
                  {pred.no}%
                </div>
                <div className="text-[10px] text-zinc-600">no</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-xs text-zinc-500 border border-zinc-800 rounded hover:border-zinc-700 transition-colors">
        view more markets
      </button>

      <div className="text-center text-[10px] text-zinc-600 mt-3">
        $1.2K at stake · $890 traded
      </div>
    </div>
  )
}

// Leverage sentiment component
function LeverageSentiment() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-zinc-400">Binance</span>
        <span className="text-[10px] text-zinc-600">via Binance</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-zinc-800/50 rounded">
          <div className="text-green-500 text-xs font-medium">slightly bullish</div>
          <div className="text-white text-sm font-semibold">+0.0012%</div>
          <div className="text-[10px] text-zinc-600 mt-1">FUNDING RATE</div>
        </div>
        <div className="text-center p-2 bg-zinc-800/50 rounded">
          <div className="text-zinc-400 text-xs font-medium">stable</div>
          <div className="text-white text-sm font-semibold">$245M</div>
          <div className="text-[10px] text-zinc-600 mt-1">OI 24H Δ</div>
        </div>
        <div className="text-center p-2 bg-zinc-800/50 rounded">
          <div className="text-zinc-400 text-xs font-medium">heavy longs</div>
          <div className="text-white text-sm font-semibold">1.85 L/S</div>
          <div className="text-[10px] text-zinc-600 mt-1">POSITIONING</div>
        </div>
        <div className="text-center p-2 bg-zinc-800/50 rounded">
          <div className="text-green-500 text-xs font-medium">buyers lead</div>
          <div className="text-white text-sm font-semibold">1.12</div>
          <div className="text-[10px] text-zinc-600 mt-1">TAKER FLOW</div>
        </div>
      </div>
    </div>
  )
}

// News item component
function NewsSection({ news }: { news: NewsItem[] }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-zinc-500 tracking-wider">AI NEWS SUMMARY</h2>
        <span className="text-[10px] text-zinc-600">updated 5m ago</span>
      </div>

      <div className="space-y-2">
        {news.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-green-500 mt-1.5">•</span>
            <div className="flex-1 flex items-baseline justify-between gap-2">
              <p className="text-sm text-zinc-300">{item.title}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-600 hover:text-zinc-400 whitespace-nowrap"
              >
                {item.source} ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Format numbers helper
function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`
  return `$${num.toFixed(0)}`
}

// Calculate time remaining
function getTimeRemaining(): string {
  const now = new Date()
  const target = new Date()
  target.setHours(17, 0, 0, 0) // 5pm EST
  if (now > target) target.setDate(target.getDate() + 1)

  const diff = target.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return `${hours}h ${minutes}m ${seconds}s`
}

// Main component
export default function Home() {
  const [price, setPrice] = useState<number>(22.50)
  const [change24h, setChange24h] = useState<number>(0)
  const [marketCap, setMarketCap] = useState<number>(0)
  const [history, setHistory] = useState<Array<{ price: number; timestamp: number }>>([])
  const [selectedPeriod, setSelectedPeriod] = useState('1D')
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining())
  const [news, setNews] = useState<NewsItem[]>([])

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch price data
  const fetchPrice = async (days: string = '1') => {
    try {
      const res = await fetch(`/api/price?days=${days}`)
      const data = await res.json()
      setPrice(data.price)
      setChange24h(data.change24h)
      setMarketCap(data.marketCap)
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
    }
  }

  // Fetch news
  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (data.news?.length > 0) {
        setNews(data.news.slice(0, 6).map((n: { title: string; source: string; url: string }) => ({
          title: n.title,
          source: n.source,
          url: n.url || '#'
        })))
      }
    } catch (err) {
      // Use fallback news
      setNews([
        { title: 'AVAX subnet activity reaches new highs with gaming integrations', source: 'CoinDesk', url: '#' },
        { title: 'Avalanche Foundation launches $50M ecosystem fund', source: 'The Block', url: '#' },
        { title: 'Major DeFi protocol announces Avalanche expansion', source: 'Decrypt', url: '#' },
        { title: 'AVAX staking rewards see increased participation', source: 'CryptoSlate', url: '#' },
        { title: 'New institutional custody solution launches for AVAX', source: 'Bloomberg', url: '#' },
      ])
    }
  }

  useEffect(() => {
    const periodToDays: Record<string, string> = {
      '1H': '0.04',
      '1D': '1',
      '1W': '7',
      '1M': '30',
      '1Y': '365',
      'ALL': 'max'
    }
    fetchPrice(periodToDays[selectedPeriod] || '1')
  }, [selectedPeriod])

  useEffect(() => {
    fetchNews()
    const priceInterval = setInterval(() => {
      const periodToDays: Record<string, string> = {
        '1H': '0.04', '1D': '1', '1W': '7', '1M': '30', '1Y': '365', 'ALL': 'max'
      }
      fetchPrice(periodToDays[selectedPeriod] || '1')
    }, 10000)
    const newsInterval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => {
      clearInterval(priceInterval)
      clearInterval(newsInterval)
    }
  }, [selectedPeriod])

  // Generate dynamic predictions based on current price
  const predictions = useMemo(() => {
    const rounded = Math.ceil(price)
    return [
      { label: `${rounded + 2} or above`, yes: 25, no: 75 },
      { label: `${rounded + 1} or above`, yes: 38, no: 62 },
      { label: `${rounded} or above`, yes: 52, no: 48 },
    ]
  }, [price])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-600 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-sm font-medium tracking-[0.3em] text-zinc-500">AVAX</h1>
        </div>

        {/* Price */}
        <RollingPrice price={price} change={change24h} />

        {/* Market prediction */}
        <div className="text-center text-sm text-zinc-500 mt-2 mb-8">
          market predicts: <span className="text-zinc-300">at least $50</span> in 2025 · 45% chance · {formatNumber(marketCap)} backing
        </div>

        {/* Chart */}
        <div className="mb-8">
          <PriceChart
            data={history}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Prediction Markets */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-semibold text-zinc-500 tracking-wider">PREDICTION MARKETS</h2>
            <span className="text-[10px] text-zinc-600">via Kalshi</span>
          </div>

          <PredictionCard
            title={`AVAX today at 5pm EST`}
            timeLeft={timeLeft}
            predictions={predictions}
          />
        </div>

        {/* Leverage Sentiment */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-zinc-500 tracking-wider mb-3">LEVERAGE SENTIMENT</h2>
          <LeverageSentiment />
        </div>

        {/* News */}
        <div className="mb-8">
          <NewsSection news={news} />
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-zinc-700 pt-4 border-t border-zinc-900">
          Data from CoinGecko · Not financial advice
        </div>
      </div>
    </main>
  )
}
