export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = searchParams.get('days') || '30'

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    // Fetch detailed market data including market cap and volume
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/avalanche-2?localization=false&tickers=false&community_data=false&developer_data=false',
      {
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }
    )
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`CoinGecko API failed: ${response.status}`)
    const coinData = await response.json()

    const price = coinData.market_data?.current_price?.usd
    const change24h = coinData.market_data?.price_change_percentage_24h
    const marketCap = coinData.market_data?.market_cap?.usd
    const volume24h = coinData.market_data?.total_volume?.usd
    const high24h = coinData.market_data?.high_24h?.usd
    const low24h = coinData.market_data?.low_24h?.usd

    if (!price) throw new Error('Invalid price data')

    // Fetch chart history based on requested time period
    const historyResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=${days}`,
      { cache: 'no-store' }
    )

    let history: Array<{ date: string; timestamp: number; price: number }> = []
    if (historyResponse.ok) {
      const historyData = await historyResponse.json()
      history = (historyData.prices || []).map((item: [number, number]) => ({
        date: new Date(item[0]).toLocaleDateString('en-US'),
        timestamp: item[0],
        price: item[1]
      }))
    }

    return Response.json({
      price: Math.round(price * 100) / 100,
      change24h: Math.round((change24h || 0) * 100) / 100,
      minPrice24h: Math.round((low24h || price * 0.98) * 100) / 100,
      maxPrice24h: Math.round((high24h || price * 1.02) * 100) / 100,
      marketCap: marketCap || 0,
      volume24h: volume24h || 0,
      history,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching price:', error)

    const now = Date.now()
    const fallbackPrice = 14.50
    const fallbackHistory = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now - (29 - i) * 24 * 60 * 60 * 1000)
      return {
        date: date.toLocaleDateString('en-US'),
        timestamp: date.getTime(),
        price: fallbackPrice + (Math.random() - 0.5) * 2
      }
    })

    return Response.json({
      price: fallbackPrice,
      change24h: -2.5,
      minPrice24h: fallbackPrice * 0.98,
      maxPrice24h: fallbackPrice * 1.02,
      marketCap: 6200000000,
      volume24h: 180000000,
      history: fallbackHistory,
      timestamp: new Date().toISOString(),
      isFallback: true
    })
  }
}
