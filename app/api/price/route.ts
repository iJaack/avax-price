export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true'
    )
    const priceData = await response.json()
    const price = priceData['avalanche-2'].usd
    const change24h = priceData['avalanche-2'].usd_24h_change

    const historyResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=30&interval=daily'
    )
    const historyData = await historyResponse.json()
    const history = historyData.prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toLocaleDateString('en-US'),
      price: item[1]
    }))

    return Response.json({
      price: Math.round(price * 100) / 100,
      change24h: Math.round(change24h * 100) / 100,
      history
    })
  } catch (error) {
    console.error('Error fetching price:', error)
    return Response.json(
      { error: 'Failed to fetch price' },
      { status: 500 }
    )
  }
}
