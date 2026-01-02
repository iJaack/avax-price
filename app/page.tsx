'use client'

import { useEffect, useRef, useState } from 'react'
import Chart from '@/components/Chart'
import { COLORS, LAYOUT, TYPOGRAPHY, ANIMATION, API_ENDPOINTS, APP_CONFIG } from '@/lib/constants'
import type { NewsItem, PriceDirection } from '@/lib/types'

// Price API Service
const priceService = {
  fetch: async () => {
    const response = await fetch(API_ENDPOINTS.PRICE)
    if (!response.ok) throw new Error('Failed to fetch price')
    return response.json()
  },
}

// News API Service
const newsService = {
  fetch: async () => {
    const response = await fetch(API_ENDPOINTS.NEWS)
    if (!response.ok) throw new Error('Failed to fetch news')
    const data = await response.json()
    return data.news || []
  },
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

    // Cleanup previous animation
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)

    // Set direction
    setPriceDirection(roundedBase > roundedDisplay ? 'up' : 'down')

    let animationStartTime: number
    const animationDuration = ANIMATION.DURATION_MS

    const animate = (timestamp: number) => {
      if (!animationStartTime) animationStartTime = timestamp
      const progress = Math.min((timestamp - animationStartTime) / animationDuration, 1)
      
      // Easing function: ease-in-out
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      const newPrice = displayPrice + (roundedBase - displayPrice) * easeProgress

      setAnimatedPrice(newPrice)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setAnimatedPrice(roundedBase)
        resetTimeoutRef.current = setTimeout(() => setPriceDirection('neutral'), ANIMATION.COLOR_RESET_DELAY)
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
    const interval = setInterval(fetchPrice, ANIMATION.PRICE_UPDATE_INTERVAL)
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

// PriceColor Utility
function getPriceColor(direction: PriceDirection): string {
  switch (direction) {
    case 'up':
      return COLORS.success
    case 'down':
      return COLORS.danger
    default:
      return COLORS.primary
  }
}

// Main Component
export default function Home() {
  const priceData = usePriceData()
  const newsData = useNewsData()
  const [displayPrice, setDisplayPrice] = useState<number | null>(null)
  const { animatedPrice, priceDirection } = usePriceAnimation(priceData.basePrice, displayPrice || priceData.basePrice)

  // Initialize display price
  useEffect(() => {
    if (displayPrice === null && priceData.basePrice !== null) {
      setDisplayPrice(priceData.basePrice)
    }
  }, [priceData.basePrice])

  if (priceData.loading) {
    return (
      <div style={{ width: LAYOUT.FULL_VIEWPORT, height: LAYOUT.FULL_HEIGHT, backgroundColor: COLORS.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLORS.muted }}>Loading...</p>
      </div>
    )
  }

  return (
    <main style={{ width: LAYOUT.FULL_VIEWPORT, height: LAYOUT.FULL_HEIGHT, backgroundColor: COLORS.dark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${LAYOUT.PADDING}px`, boxSizing: 'border-box' }}>
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
        <div style={{ color: COLORS.subtle, fontSize: TYPOGRAPHY.COIN_NAME_SIZE, letterSpacing: TYPOGRAPHY.LETTER_SPACING_WIDE, textTransform: 'uppercase', marginBottom: `${LAYOUT.GAP_MEDIUM}px` }}>
          {APP_CONFIG.COIN_NAME}
        </div>

        {/* Price Display */}
        <div style={{ textAlign: 'center', marginBottom: `${LAYOUT.GAP_MEDIUM}px` }}>
          <div className="price-display" style={{ fontSize: TYPOGRAPHY.PRICE_DISPLAY_SIZE, fontWeight: '300', color: getPriceColor(priceDirection), letterSpacing: TYPOGRAPHY.LETTER_SPACING_TIGHT }}>
            ${(animatedPrice || 0).toFixed(APP_CONFIG.DECIMAL_PLACES)}
          </div>
        </div>

        {/* 24h Stats */}
        <div style={{ display: 'flex', gap: `${LAYOUT.GAP_LARGE}px`, marginBottom: `${LAYOUT.GAP_MEDIUM}px`, justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: COLORS.subtle, fontSize: TYPOGRAPHY.STAT_LABEL_SIZE, letterSpacing: TYPOGRAPHY.LETTER_SPACING_NORMAL, marginBottom: '8px' }}>24H CHANGE</div>
            <div style={{ color: priceData.change24h && priceData.change24h > 0 ? COLORS.success : priceData.change24h && priceData.change24h < 0 ? COLORS.danger : COLORS.muted, fontSize: TYPOGRAPHY.STAT_VALUE_SIZE, fontWeight: '500' }}>
              {priceData.change24h !== null ? `${priceData.change24h > 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%` : '-'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: COLORS.subtle, fontSize: TYPOGRAPHY.STAT_LABEL_SIZE, letterSpacing: TYPOGRAPHY.LETTER_SPACING_NORMAL, marginBottom: '8px' }}>24H LOW</div>
            <div style={{ color: COLORS.muted, fontSize: TYPOGRAPHY.STAT_VALUE_SIZE, fontWeight: '500' }}>
              ${priceData.minPrice24h?.toFixed(APP_CONFIG.DECIMAL_PLACES)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: COLORS.subtle, fontSize: TYPOGRAPHY.STAT_LABEL_SIZE, letterSpacing: TYPOGRAPHY.LETTER_SPACING_NORMAL, marginBottom: '8px' }}>24H HIGH</div>
            <div style={{ color: COLORS.muted, fontSize: TYPOGRAPHY.STAT_VALUE_SIZE, fontWeight: '500' }}>
              ${priceData.maxPrice24h?.toFixed(APP_CONFIG.DECIMAL_PLACES)}
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: `${LAYOUT.GAP_MEDIUM}px` }}>
          <div style={{ width: '100%', maxWidth: `${LAYOUT.MAX_CHART_WIDTH}px`, height: `${LAYOUT.CHART_HEIGHT}px` }}>
            <Chart data={priceData.priceHistory} news={newsData.news} />
          </div>
        </div>
      </div>
    </main>
  )
}
