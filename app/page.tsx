'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatedPrice } from './components/AnimatedPrice'
import { PriceChart } from './components/PriceChart'
import { LeverageSentiment } from './components/LeverageSentiment'
import { NewsSection } from './components/NewsSection'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAnimatedValue } from './hooks/useAnimatedValue'

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
  _isFallback?: boolean
  _error?: string
}

function HomeContent() {
  const [price, setPrice] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [change24h, setChange24h] = useState<number>(0)
  const [history, setHistory] = useState<Array<{ price: number; timestamp: number }>>([])
  const [selectedPeriod, setSelectedPeriod] = useState('1D')
  const [loading, setLoading] = useState(true)
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsTimestamp, setNewsTimestamp] = useState<number>(Date.now())
  const [exchanges, setExchanges] = useState<ExchangeData[]>([
    {
      exchange: 'Hyperliquid',
      fundingRate: '0.0010',
      fundingSentiment: 'neutral',
      openInterestUsd: 120000000,
      oiChange24h: 3.5,
      oiSentiment: 'increasing',
      longShortRatio: 'N/A',
      positionSentiment: 'unknown',
      takerRatio: 'N/A',
      takerSentiment: 'unknown'
    }
  ])
  const [selectedExchange, setSelectedExchange] = useState(0)
  const [chartType, setChartType] = useState<'line' | 'candle'>('line')
  const [isChartTransitioning, setIsChartTransitioning] = useState(false)

  const animatedPrice = useAnimatedValue(price || 0, 600)
  const animatedChange = useAnimatedValue(change24h, 600)

  const fetchPrice = useCallback(async (days: string = '1') => {
    try {
      const res = await fetch(`/api/price?days=${days}&t=${Date.now()}`)
      const data = await res.json()
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

  const fetchNews = async () => {
    try {
      const res = await fetch(`/api/news?t=${Date.now()}`)
      const data = await res.json()
      if (data.news?.length > 0) {
        setNews(data.news.slice(0, 6))
        setNewsTimestamp(Date.now())
      }
    } catch {
      setNews([
        { title: 'AVAX subnet activity reaches new highs', source: 'CoinDesk', url: '#' },
        { title: 'Avalanche Foundation launches growth initiative', source: 'The Block', url: '#' },
        { title: 'Major DeFi protocol announces Avalanche expansion', source: 'Decrypt', url: '#' },
      ])
    }
  }

  const fetchLivePrice = async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const res = await fetch(`/api/price?type=live&t=${Date.now()}`, { signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        if (!data.isFallback) {
          setPrice(data.price)
          setChange24h(data.change24h)
          setLastUpdate(Date.now())
        }
      }
    } catch (e) {
      console.error('Live update failed', e)
    }
  }

  const fetchLeverage = async () => {
    try {
      const res = await fetch(`/api/leverage?t=${Date.now()}`)
      const data = await res.json()
      if (data.exchanges?.length > 0) {
        setExchanges(data.exchanges)
      }
    } catch {
      // Keep default values
    }
  }

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
    const periodMap: Record<string, string> = {
      '1H': '0.04', '1D': '1', '1W': '7', '1M': '30', '1Y': '365', 'ALL': 'max'
    }

    fetchNews()
    fetchLeverage()
    fetchPrice(periodMap[selectedPeriod] || '1')
    fetchLivePrice()

    const liveInterval = setInterval(fetchLivePrice, 1000)
    const priceInterval = setInterval(() => fetchPrice(periodMap[selectedPeriod] || '1'), 60000)
    const leverageInterval = setInterval(fetchLeverage, 60000)
    const newsInterval = setInterval(fetchNews, 60000)

    return () => {
      clearInterval(liveInterval)
      clearInterval(priceInterval)
      clearInterval(leverageInterval)
      clearInterval(newsInterval)
    }
  }, [selectedPeriod, fetchPrice])

  useEffect(() => {
    const watchdog = setInterval(() => {
      const timeSinceUpdate = Date.now() - lastUpdate
      if (timeSinceUpdate > 10000) {
        console.warn('Data is stale (10s+), retrying...')
      }
    }, 2000)
    return () => clearInterval(watchdog)
  }, [lastUpdate])

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
        {/* HEADER */}
        <div className="text-center mb-1">
          <h1 className="text-neutral-500 text-sm tracking-[0.25em] font-medium">AVAX</h1>
        </div>

        {/* PRICE */}
        <div className="text-center mb-1">
          <div className="inline-flex items-baseline">
            {price ? (
              <>
                <span className="text-white text-7xl font-extralight tracking-tight">
                  <span className="text-5xl">$</span>
                  <AnimatedPrice price={animatedPrice} />
                </span>
                <span className={`ml-4 text-xl transition-colors duration-300 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '▲' : '▼'} {Math.abs(animatedChange).toFixed(2)}%
                </span>
              </>
            ) : (
              <span className="text-white text-7xl font-extralight tracking-tight animate-pulse">---</span>
            )}
          </div>
        </div>

        {/* CHART CONTROLS */}
        <div className="flex justify-between mb-2">
          <div className="inline-flex bg-neutral-900 rounded p-0.5">
            {(['line', 'candle'] as const).map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-2.5 py-1 text-xs rounded transition-all duration-200 capitalize ${
                  chartType === type ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="inline-flex bg-neutral-900 rounded p-0.5">
            {['1H', '1D', '1W', '1M', '1Y', 'ALL'].map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-2.5 py-1 text-xs rounded transition-all duration-200 ${
                  selectedPeriod === p ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* CHART */}
        <div className="mb-10">
          <PriceChart 
            history={history} 
            chartType={chartType} 
            isTransitioning={isChartTransitioning} 
          />
        </div>

        {/* LEVERAGE */}
        <LeverageSentiment
          exchanges={exchanges}
          selectedExchange={selectedExchange}
          onSelectExchange={setSelectedExchange}
        />

        {/* NEWS */}
        <NewsSection news={news} timestamp={newsTimestamp} />

        {/* FOOTER */}
        <div className="text-center text-[10px] text-neutral-700 pt-6 border-t border-neutral-900">
          Data from CoinGecko · Not financial advice
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  )
}
