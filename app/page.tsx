'use client'

import { useEffect, useRef, useState } from 'react'
import Chart from '@/components/Chart'

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

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

// Format volume
function formatVolume(num: number): string {
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`
  return `$${num.toFixed(0)}`
}

// Days remaining until date
function daysRemaining(dateStr: string): string {
  const end = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'Ended'
  if (diff === 1) return '1 day left'
  if (diff < 30) return `${diff} days left`
  if (diff < 365) return `${Math.floor(diff / 30)} months left`
  return `${Math.floor(diff / 365)} years left`
}

// Time period options
const TIME_PERIODS = [
  { label: '1H', days: '0.04' },
  { label: '1D', days: '1' },
  { label: '1W', days: '7' },
  { label: '1M', days: '30' },
  { label: '1Y', days: '365' },
  { label: 'ALL', days: 'max' },
]

export default function Home() {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const [marketCap, setMarketCap] = useState<number>(0)
  const [volume24h, setVolume24h] = useState<number>(0)
  const [history, setHistory] = useState<Array<{ date: string; timestamp: number; price: number }>>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('1M')
  const [loading, setLoading] = useState(true)
  const prevPriceRef = useRef<number | null>(null)
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)

  // Fetch price data
  const fetchPrice = async (days: string = '30') => {
    try {
      const res = await fetch(`/api/price?days=${days}`)
      const data = await res.json()

      // Flash effect on price change
      if (prevPriceRef.current !== null && data.price !== prevPriceRef.current) {
        setPriceFlash(data.price > prevPriceRef.current ? 'up' : 'down')
        setTimeout(() => setPriceFlash(null), 500)
      }
      prevPriceRef.current = data.price

      setPrice(data.price)
      setChange24h(data.change24h)
      setMarketCap(data.marketCap)
      setVolume24h(data.volume24h)
      if (data.history?.length > 0) {
        setHistory(data.history)
      }
    } catch (err) {
      console.error('Price fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch predictions
  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/predictions')
      const data = await res.json()
      if (data.predictions?.length > 0) {
        setPredictions(data.predictions)
      }
    } catch (err) {
      console.error('Predictions fetch error:', err)
    }
  }

  useEffect(() => {
    const days = TIME_PERIODS.find(p => p.label === selectedPeriod)?.days || '30'
    fetchPrice(days)
  }, [selectedPeriod])

  useEffect(() => {
    fetchPredictions()
    // Poll price every 15 seconds
    const priceInterval = setInterval(() => {
      const days = TIME_PERIODS.find(p => p.label === selectedPeriod)?.days || '30'
      fetchPrice(days)
    }, 15000)
    // Refresh predictions every 5 minutes
    const predInterval = setInterval(fetchPredictions, 5 * 60 * 1000)
    return () => {
      clearInterval(priceInterval)
      clearInterval(predInterval)
    }
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-zinc-600">Loading...</div>
      </div>
    )
  }

  const isPositive = (change24h || 0) >= 0

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
            <span className="text-[#E84142]">AVAX</span>
          </h1>
          <p className="text-zinc-500 text-sm">blazingly fast, infinitely scalable</p>
        </div>

        {/* Price Display */}
        <div className="text-center mb-6">
          <div className={`text-5xl sm:text-7xl font-light tracking-tight transition-colors duration-300 ${
            priceFlash === 'up' ? 'text-green-400' : priceFlash === 'down' ? 'text-red-400' : 'text-white'
          }`}>
            ${(price || 0).toFixed(2)}
          </div>
          <div className={`text-lg mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{(change24h || 0).toFixed(2)}% today
          </div>
        </div>

        {/* Market Stats */}
        <div className="flex justify-center gap-6 sm:gap-10 text-sm text-zinc-400 mb-8">
          <div>{formatNumber(marketCap)} market cap</div>
          <div>{formatNumber(volume24h)} 24h volume</div>
        </div>

        {/* Time Period Selector */}
        <div className="flex justify-center gap-1 mb-6">
          {TIME_PERIODS.map(period => (
            <button
              key={period.label}
              onClick={() => setSelectedPeriod(period.label)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedPeriod === period.label
                  ? 'bg-[#E84142] text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="mb-12">
          <Chart data={history} color="#E84142" />
        </div>

        {/* Predictions Section */}
        {predictions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Crypto Predictions</h2>
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">via Polymarket</span>
            </div>

            <div className="space-y-3">
              {predictions.map(pred => (
                <a
                  key={pred.id}
                  href={pred.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base leading-tight mb-2 text-white">
                        {pred.question}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>{formatVolume(pred.volume)} volume</span>
                        <span>·</span>
                        <span>{daysRemaining(pred.endDate)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Yes</span>
                        <span className={`text-sm font-semibold ${pred.yesPrice >= 50 ? 'text-green-400' : 'text-zinc-300'}`}>
                          {pred.yesPrice}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">No</span>
                        <span className={`text-sm font-semibold ${pred.noPrice >= 50 ? 'text-red-400' : 'text-zinc-300'}`}>
                          {pred.noPrice}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      style={{ width: `${pred.yesPrice}%` }}
                    />
                  </div>
                </a>
              ))}
            </div>

            <a
              href="https://polymarket.com/crypto"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-zinc-500 hover:text-zinc-300 mt-4 transition-colors"
            >
              View all crypto markets on Polymarket →
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-zinc-600 pt-8 border-t border-zinc-900">
          <p>Data from CoinGecko · Predictions from Polymarket</p>
          <p className="mt-1">
            <a href="https://avax.network" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
              avax.network
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
