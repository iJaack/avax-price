'use client'
import { useEffect, useRef, useState } from 'react'
import Chart from '@/components/Chart'

interface NewsItem {
  title: string
  description: string
  date: string
  timestamp: number
  url: string
  source: string
}

export default function Home() {
  const [displayPrice, setDisplayPrice] = useState<number | null>(null)
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number | null>(null)
  const [minPrice24h, setMinPrice24h] = useState<number | null>(null)
  const [maxPrice24h, setMaxPrice24h] = useState<number | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral')
  const resetTimeoutRef = useRef<NodeJS.Timeout>()
  const animationFrameRef = useRef<number>()
  const currentPriceRef = useRef<number | null>(null)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/price')
        const data = await response.json()
        setBasePrice(data.price)
        setChange24h(data.change24h)
        setMinPrice24h(data.minPrice24h)
        setMaxPrice24h(data.maxPrice24h)
        setPriceHistory(data.history)
        if (displayPrice === null) {
          setDisplayPrice(data.price)
          currentPriceRef.current = data.price
        }
      } catch (error) {
        console.error('Error fetching price:', error)
      } finally {
        setLoading(false)
      }
    }

    // Fetch news data
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news')
        const data = await response.json()
        setNews(data.news || [])
      } catch (error) {
        console.error('Error fetching news:', error)
        setNews([])
      }
    }

    fetchPrice()
    fetchNews()
    const interval = setInterval(fetchPrice, 1500) // Faster updates every 1.5 seconds
    return () => clearInterval(interval)
  }, [])

  // Smooth animation towards basePrice with more responsive easing
  useEffect(() => {
    if (displayPrice === null || basePrice === null) return

    const roundedDisplay = Math.round(displayPrice * 100) / 100
    const roundedBase = Math.round(basePrice * 100) / 100

    if (roundedDisplay === roundedBase) {
      return
    }

    // Clear any pending reset
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }

    // Determine direction and set color
    if (roundedBase > roundedDisplay) {
      setPriceDirection('up')
    } else if (roundedBase < roundedDisplay) {
      setPriceDirection('down')
    }

    currentPriceRef.current = displayPrice
    let animationStartTime: number
    const animationDuration = 400 // Smooth animation in 400ms

    const startAnimation = (timestamp: number) => {
      if (!animationStartTime) animationStartTime = timestamp
      const progress = Math.min((timestamp - animationStartTime) / animationDuration, 1)

      // Easing function for smoother animation
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

      const newPrice = displayPrice + (roundedBase - displayPrice) * easeProgress
      setDisplayPrice(newPrice)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(startAnimation)
      } else {
        setDisplayPrice(roundedBase)
        // Schedule color reset after animation completes
        resetTimeoutRef.current = setTimeout(() => {
          setPriceDirection('neutral')
        }, 300)
      }
    }

    animationFrameRef.current = requestAnimationFrame(startAnimation)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [basePrice])

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const getPriceColor = () => {
    switch (priceDirection) {
      case 'up':
        return '#22c55e'
      case 'down':
        return '#ef4444'
      default:
        return '#ffffff'
    }
  }

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    )
  }

  return (
    <main style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', boxSizing: 'border-box' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {/* Coin Name */}
        <div style={{ color: '#666', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}>
          AVAX
        </div>

        {/* Price Display */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="price-display" style={{ fontSize: '80px', fontWeight: '300', color: getPriceColor(), letterSpacing: '-0.02em' }}>
            ${displayPrice?.toFixed(2)}
          </div>
        </div>

        {/* 24h Stats */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '64px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>24H CHANGE</div>
            <div style={{ color: change24h && change24h > 0 ? '#22c55e' : change24h && change24h < 0 ? '#ef4444' : '#888', fontSize: '16px', fontWeight: '500' }}>
              {change24h !== null ? `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%` : '-'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>24H LOW</div>
            <div style={{ color: '#888', fontSize: '16px', fontWeight: '500' }}>
              ${minPrice24h?.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: '12px', letterSpacing: '0.05em', marginBottom: '8px' }}>24H HIGH</div>
            <div style={{ color: '#888', fontSize: '16px', fontWeight: '500' }}>
              ${maxPrice24h?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '64px' }}>
          <div style={{ width: '100%', maxWidth: '900px', height: '300px' }}>
            <Chart data={priceHistory} news={news} />
          </div>
        </div>
      </div>
    </main>
  )
}
