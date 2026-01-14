'use client'

import { useEffect, useRef, useState } from 'react'
import Chart from '@/components/Chart'
import type { NewsItem, PriceDirection } from '@/lib/types'

// PriceDisplay Component
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

// PriceStats Component
function PriceStats({
  change24h,
  minPrice24h,
  maxPrice24h,
}: {
  change24h: number | null
  minPrice24h: number | null
  maxPrice24h: number | null
}) {
  const getChangeColor = () => {
    if (!change24h) return 'text-gray-400'
    return change24h > 0 ? 'text-green-400' : 'text-red-400'
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return `$${price.toFixed(2)}`
  }

  return (
    <div className="flex gap-10 mb-16 justify-center w-full flex-wrap">
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">24H Change</div>
        <div className={`text-sm font-medium ${getChangeColor()}`}>
          {change24h !== null ? `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%` : '-'}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">24H Low</div>
        <div className="text-sm font-medium text-gray-400">{formatPrice(minPrice24h)}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">24H High</div>
        <div className="text-sm font-medium text-gray-400">{formatPrice(maxPrice24h)}</div>
      </div>
    </div>
  )
}

// Custom Hook: Price Animation
function usePriceAnimation(targetPrice: number | null) {
  const [animatedPrice, setAnimatedPrice] = useState<number | null>(null)
  const [priceDirection, setPriceDirection] = useState<PriceDirection>('neutral')
  const prevPriceRef = useRef<number | null>(null)
  const animationRef = useRef<number>()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (targetPrice === null) return

    const rounded = Math.round(targetPrice * 100) / 100
    const prev = prevPriceRef.current

    // First load - set immediately
    if (prev === null) {
      setAnimatedPrice(rounded)
      prevPriceRef.current = rounded
      return
    }

    // No change
    if (rounded === prev) return

    // Clear previous animations
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    // Set direction
    setPriceDirection(rounded > prev ? 'up' : 'down')

    // Animate
    const duration = 400
    let start: number
    const startPrice = prev

    const animate = (time: number) => {
      if (!start) start = time
      const progress = Math.min((time - start) / duration, 1)
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      setAnimatedPrice(startPrice + (rounded - startPrice) * ease)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        prevPriceRef.current = rounded
        timeoutRef.current = setTimeout(() => setPriceDirection('neutral'), 500)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [targetPrice])

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { animatedPrice, priceDirection }
}

// Main Component
export default function Home() {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const [minPrice24h, setMinPrice24h] = useState<number | null>(null)
  const [maxPrice24h, setMaxPrice24h] = useState<number | null>(null)
  const [history, setHistory] = useState<Array<{ date: string; timestamp: number; price: number }>>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  const { animatedPrice, priceDirection } = usePriceAnimation(price)

  // Fetch price data
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/price')
        const data = await res.json()
        setPrice(data.price)
        setChange24h(data.change24h)
        setMinPrice24h(data.minPrice24h)
        setMaxPrice24h(data.maxPrice24h)
        if (data.history?.length > 0) {
          setHistory(data.history)
        }
      } catch (err) {
        console.error('Price fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchPrice, 10000)
    return () => clearInterval(interval)
  }, [])

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news')
        const data = await res.json()
        if (data.news?.length > 0) {
          setNews(data.news)
        }
      } catch (err) {
        console.error('News fetch error:', err)
      }
    }

    fetchNews()
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <main className="w-screen h-screen bg-black flex flex-col items-center justify-center px-8">
      <div className="flex flex-col items-center justify-center w-full h-full">
        <PriceDisplay price={animatedPrice} direction={priceDirection} coinName="AVAX" />

        <PriceStats
          change24h={change24h}
          minPrice24h={minPrice24h}
          maxPrice24h={maxPrice24h}
        />

        <div className="w-full flex justify-center mb-16">
          <div className="w-full max-w-[900px] h-[300px]">
            <Chart data={history} news={news} />
          </div>
        </div>
      </div>
    </main>
  )
}
