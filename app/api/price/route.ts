export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch current price from CoinGecko with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true',
      {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      }
    )
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`CoinGecko API failed: ${response.status}`)
    const priceData = await response.json()
    const price = priceData['avalanche-2']?.usd
    const change24h = priceData['avalanche-2']?.usd_24h_change

    if (!price) throw new Error('Invalid price data')

    // Fetch 24-hour and 30-day data in parallel
    const [day24Response, historyResponse] = await Promise.all([
      fetch(
        'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=1&interval=hourly',
        { cache: 'no-store' }
      ),
      fetch(
        'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=30&interval=daily',
        { cache: 'no-store' }
      )
    ])

    if (!day24Response.ok || !historyResponse.ok) throw new Error('History fetch failed')

    const day24Data = await day24Response.json()
    const historyData = await historyResponse.json()

    // Calculate 24h min/max from hourly data
    const last24hPrices = day24Data.prices?.map((item: [number, number]) => item[1]) || []
    const minPrice24h = last24hPrices.length > 0 ? Math.min(...last24hPrices, price) : price * 0.98
    const maxPrice24h = last24hPrices.length > 0 ? Math.max(...last24hPrices, price) : price * 1.02

    // Use 30-day daily data for chart
    const history = (historyData.prices || []).map((item: [number, number]) => ({
      date: new Date(item[0]).toLocaleDateString('en-US'),
      timestamp: item[0],
      price: item[1]
    }))

    return Response.json({
      price: Math.round(price * 100) / 100,
      change24h: Math.round((change24h || 0) * 100) / 100,
      minPrice24h: Math.round(minPrice24h * 100) / 100,
      maxPrice24h: Math.round(maxPrice24h * 100) / 100,
      history,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching price:', error)

    // Return fallback data so the app doesn't break
    const now = Date.now()
    const fallbackPrice = 22.50 // Approximate AVAX price
    const fallbackHistory = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now - (29 - i) * 24 * 60 * 60 * 1000)
      return {
        date: date.toLocaleDateString('en-US'),
        timestamp: date.getTime(),
        price: fallbackPrice + (Math.random() - 0.5) * 4
      }
    })

    return Response.json({
      price: fallbackPrice,
      change24h: 0,
      minPrice24h: fallbackPrice * 0.98,
      maxPrice24h: fallbackPrice * 1.02,
      history: fallbackHistory,
      timestamp: new Date().toISOString(),
      isFallback: true
    })
  }
}
