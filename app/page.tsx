'use client'

import { useEffect, useRef, useState } from 'react'
import Chart from '@/components/Chart'
import type { NewsItem, PriceDirection } from '@/lib/types'

// Price API Service
const priceService = {
  fetch: async () => {
    const response = await fetch('/api/price')
    if (!response.ok) throw new Error('Failed to fetch price')
    return response.json()
  },
}

// News API Service
const newsService = {
  fetch: async () => {
    const response = await fetch('/api/news')
    if (!response.ok) throw new Error('Failed to fetch news')
    const data = await response.json()
    return data.news || []
  },
}

// PriceDisplay Component with Tailwind
function PriceDisplay({
  price,
  direction,
  coinName = 'AVAX',
}: {
  price: number | null
  direction: PriceDirection
  coinName?: string
}) {
  const getPriceColor = () => {
    switch (direction) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-white'
    }
  }

  return (
    <>
      <style>{`
        @keyframes priceGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
          50% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
        }
        .price-display {
          animation: priceGlow 2s ease-in-out infinite;
          transition: color 0.3s ease;
        }
      `}</style>
      <div className="text-gray-600 text-xs uppercase tracking-widest mb-16">
        {coinName}
      </div>
      <div className="text-center mb-16">
        <div className={`price-display text-8xl font-light ${getPriceColor()} tracking-tight`}>
          ${(price || 0).toFixed(2)}
        </div>
      </div>
    </>
  )
}

// PriceStats Component with Tailwind
function PriceStats({
  change24h,
  minPrice24h,
  maxPrice24h,
  decimalPlaces = 2,
}: {
  change24h: number | null
  minPrice24h: number | null
  maxPrice24h: number | null
  decimalPlaces?: number
}) {
  const getChangeColor = () => {
    if (!change24h) return 'text-gray-400'
    return change24h > 0 ? 'text-green-400' : 'text-red-400'
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return `$${price.toFixed(decimalPlaces)}`
  }

  return (
    <div className="flex gap-10 mb-16 justify-center w-full flex-wrap">
      {/* 24H Change */}
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">24H Change</div>
        <div className={`text-sm font-medium ${getChangeColor()}`}>
          {change24h !== null ? `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%` : '-'}
        </div>
      </div>
      {/* 24H Low */}
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">24H Low</div>
        <div className="text-sm font-medium text-gray-400">{formatPrice(minPrice24h)}</div>
      </div>
      {/* 24H High */}
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">24H High</div>
        <div className="text-sm font-medium text-gray-400">{formatPrice(maxPrice24h)}</div>
      </div>
    </div>
  )
}

// Custom Hook: usePriceAnimation
function usePriceAnimation(basePrice: number | null, displayPrice: number | null) {
  const [animatedPrice, setAnimatedPrice] = useState(displayPrice)
  const [priceDirection, setPriceDirection] = useState<PriceDirection>('neutral')
  const animationFrameRef = useRef<number>()
  const resetTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!displayPrice || !basePrice) return

    const roundedDisplay = Math.round(displayPrice * 100) / 100
    const roundedBase = Math.round(basePrice * 100) / 100

    if (roundedDisplay === roundedBase) return

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)

    setPriceDirection(roundedBase > roundedDisplay ? 'up' : 'down')

    let animationStartTime: number
    const animationDuration = 400

    const animate = (timestamp: number) => {
      if (!animationStartTime) animationStartTime = timestamp
      const progress = Math.min((timestamp - animationStartTime) / animationDuration, 1)
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      const newPrice = displayPrice + (roundedBase - displayPrice) * easeProgress

      setAnimatedPrice(newPrice)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setAnimatedPrice(roundedBase)
        resetTimeoutRef.current = setTimeout(() => setPriceDirection('neutral'), 300)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [basePrice])

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  return { animatedPrice, priceDirection }
}

// Custom Hook: usePriceData
function usePriceData() {
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const [minPrice24h, setMinPrice24h] = useState<number | null>(null)
  const [maxPrice24h, setMaxPrice24h] = useState<number | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await priceService.fetch()
        setBasePrice(data.price)
        setChange24h(data.change24h)
        setMinPrice24h(data.minPrice24h)
        setMaxPrice24h(data.maxPrice24h)
        setPriceHistory(data.history)
        setError(null)
      } catch (err) {
        console.error('Error fetching price:', err)
        setError('Failed to fetch price data')
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 1500)
    return () => clearInterval(interval)
  }, [])

  return { basePrice, change24h, minPrice24h, maxPrice24h, priceHistory, loading, error }
}

// Custom Hook: useNewsData
function useNewsData() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await newsService.fetch()
        setNews(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching news:', err)
        setError('Failed to fetch news')
        setNews([])
      }
    }

    fetchNews()
  }, [])

  return { news, error }
}

// Main Component
export default function Home() {
  const priceData = usePriceData()
  const newsData = useNewsData()
  const [displayPrice, setDisplayPrice] = useState<number | null>(null)
  const { animatedPrice, priceDirection } = usePriceAnimation(priceData.basePrice, displayPrice || priceData.basePrice)

  useEffect(() => {
    if (displayPrice === null && priceData.basePrice !== null) {
      setDisplayPrice(priceData.basePrice)
    }
  }, [priceData.basePrice])

  if (priceData.loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <main className="w-screen h-screen bg-black flex flex-col items-center justify-center px-8">
      <div className="flex flex-col items-center justify-center w-full h-full">
        {/* Price Display */}
        <PriceDisplay price={animatedPrice} direction={priceDirection} coinName="AVAX" />

        {/* Price Stats */}
        <PriceStats
          change24h={priceData.change24h}
          minPrice24h={priceData.minPrice24h}
          maxPrice24h={priceData.maxPrice24h}
          decimalPlaces={2}
        />

        {/* Chart Container */}
        <div className="w-full flex justify-center mb-16">
          <div className="w-full max-w-[900px] h-[300px]">
            <Chart data={priceData.priceHistory} news={newsData.news} />
          </div>
        </div>
      </div>
    </main>
  )
}
