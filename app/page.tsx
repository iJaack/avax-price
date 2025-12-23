'use client'

import { useEffect, useState } from 'react'
import Chart from '@/components/Chart'

export default function Home() {
  const [price, setPrice] = useState<number | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/price')
        const data = await response.json()
        setPrice(data.price)
        setPriceHistory(data.history)
      } catch (error) {
        console.error('Error fetching price:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 1000)

    return () => clearInterval(interval)
  }, [])

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
        @keyframes fadeInOut {
          0% { opacity: 1; }
          49% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        .price-update {
          animation: fadeInOut 0.6s ease-in-out;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {/* Coin Name */}
        <div style={{ color: '#666', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}>
          AVAX
        </div>

        {/* Price Display */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div key={Math.round((price || 0) * 100)} className="price-update" style={{ fontSize: '80px', fontWeight: '300', color: '#4ade80', letterSpacing: '-0.02em' }}>
            ${price?.toFixed(2)}
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
