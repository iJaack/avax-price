'use client'

import { useEffect, useState } from 'react'
import Chart from '@/components/Chart'

export default function Home() {
  const [displayPrice, setDisplayPrice] = useState<number | null>(null)
  const [basePrice, setBasePrice] = useState<number | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  // Continuous fluid animation with visible price fluctuations
  useEffect(() => {
    if (displayPrice === null) return

    let animationFrameId: number
    let targetPrice = basePrice || displayPrice
    let fluctuationDirection = 1
    let fluctuationStepCounter = 0

    const animate = () => {
      setDisplayPrice(prev => {
        if (prev === null) return prev

        // If base price changed, smoothly move towards it  
        if (basePrice && Math.abs(basePrice - targetPrice) > 0.01) {
          targetPrice += (basePrice - targetPrice) * 0.05
        }

        // Create visible oscillating fluctuations
        fluctuationStepCounter++
        if (fluctuationStepCounter > 20) {
          fluctuationStepCounter = 0
          fluctuationDirection *= -1
        }

        // Larger fluctuations for visible changes (±0.01 to ±0.03)
        const fluctuationAmount = (0.01 + Math.random() * 0.02) * fluctuationDirection
        const newPrice = targetPrice + fluctuationAmount

        return Math.round(newPrice * 100) / 100
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [basePrice, displayPrice])

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
          0%, 100% { text-shadow: 0 0 10px rgba(74, 222, 128, 0.3); }
          50% { text-shadow: 0 0 20px rgba(74, 222, 128, 0.8); }
        }
        .price-display {
          animation: priceGlow 2s ease-in-out infinite;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {/* Coin Name */}
        <div style={{ color: '#666', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}>
          AVAX
        </div>

        {/* Price Display with Glow Animation */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="price-display" style={{ fontSize: '80px', fontWeight: '300', color: '#4ade80', letterSpacing: '-0.02em' }}>
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
