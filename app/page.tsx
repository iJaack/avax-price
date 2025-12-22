// v2 centered UI
'use client'

import { useEffect, useState } from 'react'
import Chart from '@/components/Chart'

export default function Home() {
  const [price, setPrice] = useState<number | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [change24h, setChange24h] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/price')
        const data = await response.json()
        setPrice(data.price)
        setPriceHistory(data.history)
        setChange24h(data.change24h)
      } catch (error) {
        console.error('Error fetching price:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-12">
        <div className="text-center">
          <h1 className="text-sm tracking-widest text-gray-500 uppercase mb-16">AVAX</h1>
          <div className="text-center mb-8">
            <div className="text-8xl font-extralight tracking-tight mb-6">${price?.toFixed(2)}</div>
            {change24h !== null && (
              <div className={`text-2xl font-light tracking-wide ${
                change24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-3xl h-72">
            <Chart data={priceHistory} />
          </div>
        </div>

        <div className="text-center text-gray-600 text-sm tracking-wide">show blocks</div>
      </div>
    </main>
  )
}
