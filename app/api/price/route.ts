export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'
    )

    const price = response.json().then((data: any) => data['avalanche-2'].usd)
    const change24h = response.json().then((data: any) => data['avalanche-2'].usd_24h_change)

    const historyResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/avalanche-2/market_chart?vs_currency=usd&days=30&interval=daily'
    )

    const data = await response.json()
    const history = (await historyResponse.json()).prices.map((item: [number, number]) => ({
      date: new Date(item[0]).toLocaleDateString('en-US'),
      price: item[1]
    }))

    return Response.json({
      price: Math.round((await price) * 100) / 100,
      change24h: Math.round((await change24h) * 100) / 100,
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
