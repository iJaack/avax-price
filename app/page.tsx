'use client'
import { useEffect, useState } from 'react'
import PriceDisplay from '@/components/PriceDisplay'
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

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <PriceDisplay price={price} change24h={change24h} />
            <div className="mt-12">
              <Chart data={priceHistory} />
            </div>
            <div className="mt-8 text-center text-gray-500 text-sm">
              show blocks
            </div>
          </>
        )}
      </div>
    </main>
  )
}
