'use client'

import { useEffect, useState, useMemo } from 'react'

interface NewsItem {
  title: string
  source: string
  url: string
}

// Rolling number digit
function Digit({ value }: { value: string }) {
  return (
    <span className="inline-block tabular-nums">{value}</span>
  )
}

// Format price for display
function formatPrice(price: number): string {
  return price.toFixed(2)
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

interface LeverageData {
  fundingRate: string
  fundingSentiment: string
  openInterestUsd: number
  oiSentiment: string
  longShortRatio: string
  positionSentiment: string
  takerRatio: string
  takerSentiment: string
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
  const [leverage, setLeverage] = useState<LeverageData>({
    fundingRate: '0.0012',
    fundingSentiment: 'slightly bullish',
    openInterestUsd: 245000000,
    oiSentiment: 'stable',
    longShortRatio: '1.85',
    positionSentiment: 'heavy longs',
    takerRatio: '1.12',
    takerSentiment: 'buyers lead'
  })

  // Timer for countdown
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch price
  const fetchPrice = async (days: string = '1') => {
    try {
      const res = await fetch(`/api/price?days=${days}`)
      const data = await res.json()
      if (data.price) setPrice(data.price)
      if (data.change24h !== undefined) setChange24h(data.change24h)
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
    }
  }

  // Fetch news
  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (data.news?.length > 0) {
        setNews(data.news.slice(0, 6))
      }
    } catch {
      setNews([
        { title: 'AVAX subnet activity reaches new highs with gaming integrations', source: 'CoinDesk', url: 'https://www.coindesk.com/search?q=avalanche' },
        { title: 'Avalanche Foundation launches ecosystem growth initiative', source: 'The Block', url: 'https://www.theblock.co/search?query=avalanche' },
        { title: 'Major DeFi protocol announces Avalanche expansion', source: 'Decrypt', url: 'https://decrypt.co/search?query=avalanche' },
        { title: 'AVAX staking rewards see increased participation', source: 'CryptoSlate', url: 'https://cryptoslate.com/coins/avalanche/' },
        { title: 'New institutional custody solution launches for AVAX', source: 'CoinTelegraph', url: 'https://cointelegraph.com/tags/avalanche' },
      ])
    }
  }

  // Fetch leverage data
  const fetchLeverage = async () => {
    try {
      const res = await fetch('/api/leverage')
      const data = await res.json()
      setLeverage({
        fundingRate: data.fundingRate || '0.0012',
        fundingSentiment: data.fundingSentiment || 'slightly bullish',
        openInterestUsd: data.openInterestUsd || 245000000,
        oiSentiment: data.oiSentiment || 'stable',
        longShortRatio: data.longShortRatio || '1.85',
        positionSentiment: data.positionSentiment || 'heavy longs',
        takerRatio: data.takerRatio || '1.12',
        takerSentiment: data.takerSentiment || 'buyers lead'
      })
    } catch {
      // Keep default values
    }
  }

  useEffect(() => {
    const periodMap: Record<string, string> = {
      '1H': '0.04', '1D': '1', '1W': '7', '1M': '30', '1Y': '365', 'ALL': 'max'
    }
    fetchPrice(periodMap[selectedPeriod] || '1')
  }, [selectedPeriod])

  useEffect(() => {
    fetchNews()
    fetchLeverage()
    const priceInterval = setInterval(() => {
      const periodMap: Record<string, string> = {
        '1H': '0.04', '1D': '1', '1W': '7', '1M': '30', '1Y': '365', 'ALL': 'max'
      }
      fetchPrice(periodMap[selectedPeriod] || '1')
    }, 10000)
    const leverageInterval = setInterval(fetchLeverage, 60000) // Update leverage every minute
    return () => {
      clearInterval(priceInterval)
      clearInterval(leverageInterval)
    }
  }, [selectedPeriod])

  // Chart calculations
  const chartData = useMemo(() => {
    if (!history.length) return { points: '', min: 0, max: 0, mid: 0 }
    const prices = history.map(h => h.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const mid = (min + max) / 2
    const range = max - min || 1

    const pts = history.map((h, i) => {
      const x = (i / (history.length - 1)) * 100
      const y = 100 - ((h.price - min) / range) * 100
      return `${x},${y}`
    }).join(' ')

    return { points: pts, min, max, mid }
  }, [history])

  // Dynamic predictions based on price
  const predictions = useMemo(() => {
    const base = Math.ceil(price)
    return [
      { label: `${base + 2} or above`, yes: 25, no: 75 },
      { label: `${base + 1} or above`, yes: 38, no: 62 },
      { label: `${base} or above`, yes: 52, no: 48 },
    ]
  }, [price])

  const isPositive = change24h >= 0

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-[680px] mx-auto px-6 py-12">

        {/* HEADER - AVAX */}
        <div className="text-center mb-1">
          <h1 className="text-neutral-500 text-sm tracking-[0.25em] font-medium">AVAX</h1>
        </div>

        {/* PRICE */}
        <div className="text-center mb-1">
          <div className="inline-flex items-baseline">
            <span className="text-white text-7xl font-extralight tracking-tight">
              <span className="text-5xl">$</span>
              {formatPrice(price).split('.')[0]}
              <span className="text-5xl">.{formatPrice(price).split('.')[1]}</span>
            </span>
            <span className={`ml-4 text-xl ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* MARKET PREDICTION */}
        <div className="text-center text-neutral-500 text-sm mb-10">
          market predicts: <span className="text-neutral-300">at least $50</span> in 2025 · 45% chance · ${(marketCap / 1e9).toFixed(1)}B backing
        </div>

        {/* TIME SELECTOR */}
        <div className="flex justify-end mb-2">
          <div className="inline-flex bg-neutral-900 rounded p-0.5">
            {['1H', '1D', '1W', '1M', '1Y', 'ALL'].map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-2.5 py-1 text-xs rounded transition-all ${
                  selectedPeriod === p
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* CHART */}
        <div className="relative h-48 mb-10">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="#262626" strokeWidth="0.3" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#262626" strokeWidth="0.3" />
            <line x1="0" y1="100" x2="100" y2="100" stroke="#262626" strokeWidth="0.3" />
            {/* Price line */}
            <polyline
              points={chartData.points}
              fill="none"
              stroke="#737373"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* Price labels */}
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-neutral-600 -mr-10 py-1">
            <span>${chartData.max.toFixed(0)}</span>
            <span>${chartData.mid.toFixed(0)}</span>
            <span>${chartData.min.toFixed(0)}</span>
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
                      <div className={`text-sm font-semibold ${pred.yes >= 50 ? 'text-green-500' : 'text-green-600/70'}`}>
                        {pred.yes}%
                      </div>
                      <div className="text-[10px] text-neutral-600">yes</div>
                    </div>
                    <div className="text-center w-14">
                      <div className={`text-sm font-semibold ${pred.no >= 50 ? 'text-red-500' : 'text-red-600/70'}`}>
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
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-neutral-400">Binance</span>
              <span className="text-[10px] text-neutral-600">via Binance</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                <div className={`text-[11px] font-medium mb-1 ${leverage.fundingSentiment.includes('bullish') ? 'text-green-500' : leverage.fundingSentiment.includes('bearish') ? 'text-red-500' : 'text-neutral-400'}`}>
                  {leverage.fundingSentiment}
                </div>
                <div className="text-white text-sm font-semibold">+{leverage.fundingRate}%</div>
                <div className="text-[9px] text-neutral-600 mt-1">FUNDING RATE</div>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                <div className="text-neutral-400 text-[11px] font-medium mb-1">{leverage.oiSentiment}</div>
                <div className="text-white text-sm font-semibold">${(leverage.openInterestUsd / 1e6).toFixed(0)}M</div>
                <div className="text-[9px] text-neutral-600 mt-1">OPEN INTEREST</div>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                <div className={`text-[11px] font-medium mb-1 ${leverage.positionSentiment.includes('long') ? 'text-green-500' : 'text-red-500'}`}>
                  {leverage.positionSentiment}
                </div>
                <div className="text-white text-sm font-semibold">{leverage.longShortRatio} L/S</div>
                <div className="text-[9px] text-neutral-600 mt-1">POSITIONING</div>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                <div className={`text-[11px] font-medium mb-1 ${leverage.takerSentiment.includes('buyers') ? 'text-green-500' : 'text-red-500'}`}>
                  {leverage.takerSentiment}
                </div>
                <div className="text-white text-sm font-semibold">{leverage.takerRatio}</div>
                <div className="text-[9px] text-neutral-600 mt-1">TAKER FLOW</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI NEWS SUMMARY */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs text-neutral-500 font-semibold tracking-wide">AI NEWS SUMMARY</h2>
            <span className="text-[10px] text-neutral-600">updated 5m ago</span>
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
                    className="text-[10px] text-neutral-600 hover:text-neutral-400 whitespace-nowrap flex-shrink-0"
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
