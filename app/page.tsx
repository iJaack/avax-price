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
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <main className="w-screen h-screen bg-black flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center w-full h-full px-8">
        {/* Coin Name */}
        <div className="text-gray-500 text-sm tracking-widest uppercase mb-8">
          AVAX
        </div>

        {/* Price Display */}
        <div className="text-center mb-16">
          <div className="text-7xl font-light text-white tracking-tight">
            ${price?.toFixed(2)}
          </div>
        </div>

        {/* Chart Container */}
        <div className="w-full flex justify-center mb-16">
          <div className="w-full max-w-3xl h-72">
            <Chart data={priceHistory} />
          </div>
        </div>

        {/* Show Blocks Button */}
        <div className="text-gray-500 text-xs tracking-widest uppercase">
          show blocks
        </div>
      </div>
    </main>
  )
}
