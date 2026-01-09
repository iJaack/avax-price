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

    // Fetch historical data (30 days to get reliable min/max)
    const historyResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=30&interval=daily',
      { cache: 'no-store' }
    )
    
    if (!historyResponse.ok) throw new Error('History fetch failed')
    const historyData = await historyResponse.json()

    // Extract last 24 hours of data
    const last24hPrices = historyData.prices.slice(-2).map((item: [number, number]) => item[1])
    const minPrice24h = Math.min(...last24hPrices)
    const maxPrice24h = Math.max(...last24hPrices)

    const history = historyData.prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toLocaleDateString('en-US'),
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
