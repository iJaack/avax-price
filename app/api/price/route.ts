export async function GET() {
  try {
    // Fetch current price from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_market_cap_change_24h=true',
      { cache: 'no-store' }
    )

    if (!response.ok) throw new Error('CoinGecko API failed')
    const priceData = await response.json()
    const price = priceData['avalanche-2'].usd
    const change24h = priceData['avalanche-2'].usd_24h_change

    // Fetch 24-hour data for min/max calculation
    const day24Response = await fetch(
      'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=1&interval=hourly',
      { cache: 'no-store' }
    )

    // Fetch 30-day data for chart history
    const historyResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=30&interval=daily',
      { cache: 'no-store' }
    )

    if (!day24Response.ok || !historyResponse.ok) throw new Error('History fetch failed')

    const day24Data = await day24Response.json()
    const historyData = await historyResponse.json()

    // Calculate 24h min/max from hourly data
    const last24hPrices = day24Data.prices.map((item: [number, number]) => item[1])
    const minPrice24h = Math.min(...last24hPrices, price)
    const maxPrice24h = Math.max(...last24hPrices, price)

    // Use 30-day daily data for chart - include timestamp for accurate news positioning
    const history = historyData.prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toLocaleDateString('en-US'),
      timestamp: item[0],
      price: item[1]
    }))

    return Response.json({
      price: Math.round(price * 100) / 100,
      basePrice: price,
      change24h: Math.round(change24h * 100) / 100,
      minPrice24h: Math.round(minPrice24h * 100) / 100,
      maxPrice24h: Math.round(maxPrice24h * 100) / 100,
      history,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching price:', error)
    return Response.json(
      {
        error: 'Failed to fetch price'
      },
      { status: 500 }
    )
  }
}
