'use client'

import { useEffect, useState } from 'react'
import Chart from '@/components/Chart'

export default function Home() {
  const [displayPrice, setDisplayPrice] = useState<number | null>(null)
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral')

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/price')
        const data = await response.json()
        setBasePrice(data.price)
        setPriceHistory(data.history)
        if (displayPrice === null) {
          setDisplayPrice(data.price)
        }
      } catch (error) {
        console.error('Error fetching price:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 3000) // Fetch every 3 seconds

    return () => clearInterval(interval)
  }, [])

  // Smooth animation towards basePrice - only when significant change detected
  useEffect(() => {
    if (displayPrice === null || basePrice === null) return

    let animationFrameId: number
    let timeoutId: NodeJS.Timeout

    const roundedDisplay = Math.round(displayPrice * 100) / 100
    const roundedBase = Math.round(basePrice * 100) / 100

    // Only animate if the rounded values are different (second decimal changed)
    if (roundedDisplay !== roundedBase) {
      let currentPrice = displayPrice

      // Determine direction
      if (roundedBase > roundedDisplay) {
        setPriceDirection('up')
      } else if (roundedBase < roundedDisplay) {
        setPriceDirection('down')
      }

      const animate = () => {
        const diff = roundedBase - currentPrice

        if (Math.abs(diff) < 0.001) {
          // Snap to target when very close
          setDisplayPrice(roundedBase)
          // Reset color after animation completes
          timeoutId = setTimeout(() => {
            setPriceDirection('neutral')
          }, 300)
          return
        }

        // Smooth interpolation
        currentPrice += diff * 0.1
        setDisplayPrice(currentPrice)
        animationFrameId = requestAnimationFrame(animate)
      }

      animationFrameId = requestAnimationFrame(animate)
      return () => {
        cancelAnimationFrame(animationFrameId)
        clearTimeout(timeoutId)
      }
    }
  }, [basePrice, displayPrice])

  const getPriceColor = () => {
    switch (priceDirection) {
      case 'up':
        return '#22c55e' // Green
      case 'down':
        return '#ef4444' // Red
      default:
        return '#ffffff' // White
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

        {/* Chart Container */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '64px' }}>
          <div style={{ width: '100%', maxWidth: '900px', height: '300px' }}>
            <Chart data={priceHistory} />
          </div>
        </div>
      </div>
    </main>
  )
}
