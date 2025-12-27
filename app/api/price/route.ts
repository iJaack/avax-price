export async function GET() {
  try {
    // Fetch current price from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true'
    )
    const priceData = await response.json()
    const price = priceData['avalanche-2'].usd
    const change24h = priceData['avalanche-2'].usd_24h_change

    // Fetch historical data
    const historyResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=1&interval=hourly'
    )
    const historyData = await historyResponse.json()
    const history = historyData.prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toLocaleDateString('en-US'),
      price: item[1]
    }))

    // Calculate min/max for last 24 hours
    const prices24h = historyData.prices.map((item: [number, number]) => item[1])
    const minPrice24h = Math.min(...prices24h)
    const maxPrice24h = Math.max(...prices24h)

    // Generate micro-fluctuations for real-time appearance
    // This creates the illusion of real-time updates with small random variations
    const basePrice = price
    const fluctuation = (Math.random() - 0.5) * (basePrice * 0.001) // ±0.05% variation
    const fluidPrice = basePrice + fluctuation

    return Response.json({
      price: Math.round(fluidPrice * 100) / 100,
      basePrice: price,
      change24h: Math.round(change24h * 100) / 100,
      minPrice24h: Math.round(minPrice24h * 100) / 100,
      maxPrice24h: Math.round(maxPrice24h * 100) / 100,
      history
    })
  } catch (error) {
    console.error('Error fetching price:', error)
    return Response.json(
      {
        error: 'Failed to fetch price'
      },
      {
        status: 500
      }
    )
  }
}
