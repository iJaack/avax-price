export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PolymarketEvent {
  id: string
  title: string
  slug: string
  endDate: string
  markets: Array<{
    id: string
    question: string
    outcomePrices: string
    volume: string
    liquidity: string
  }>
}

export async function GET() {
  try {
    // Fetch crypto-related prediction markets from Polymarket
    // Using their public CLOB API
    const response = await fetch(
      'https://gamma-api.polymarket.com/events?closed=false&tag=crypto&limit=20',
      {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Polymarket API failed: ${response.status}`)
    }

    const events: PolymarketEvent[] = await response.json()

    // Filter and format the predictions
    const predictions = events
      .filter(event => event.markets && event.markets.length > 0)
      .slice(0, 6)
      .map(event => {
        const market = event.markets[0]
        const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [0.5, 0.5]
        const yesPrice = parseFloat(prices[0]) || 0.5
        const noPrice = parseFloat(prices[1]) || 0.5

        return {
          id: event.id,
          title: event.title,
          question: market.question || event.title,
          yesPrice: Math.round(yesPrice * 100),
          noPrice: Math.round(noPrice * 100),
          volume: parseFloat(market.volume) || 0,
          liquidity: parseFloat(market.liquidity) || 0,
          endDate: event.endDate,
          slug: event.slug,
          url: `https://polymarket.com/event/${event.slug}`
        }
      })

    return Response.json({
      predictions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching predictions:', error)

    // Return fallback crypto predictions
    const now = Date.now()
    const fallbackPredictions = [
      {
        id: '1',
        title: 'Will Bitcoin hit $150K in 2025?',
        question: 'Will Bitcoin hit $150K in 2025?',
        yesPrice: 34,
        noPrice: 66,
        volume: 2500000,
        liquidity: 500000,
        endDate: new Date(now + 180 * 24 * 60 * 60 * 1000).toISOString(),
        slug: 'btc-150k-2025',
        url: 'https://polymarket.com/crypto'
      },
      {
        id: '2',
        title: 'Will Ethereum reach $10K in 2025?',
        question: 'Will Ethereum reach $10K in 2025?',
        yesPrice: 22,
        noPrice: 78,
        volume: 1800000,
        liquidity: 350000,
        endDate: new Date(now + 200 * 24 * 60 * 60 * 1000).toISOString(),
        slug: 'eth-10k-2025',
        url: 'https://polymarket.com/crypto'
      },
      {
        id: '3',
        title: 'Will a new crypto ETF be approved in Q1 2025?',
        question: 'Will a new crypto ETF be approved in Q1 2025?',
        yesPrice: 67,
        noPrice: 33,
        volume: 950000,
        liquidity: 200000,
        endDate: new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString(),
        slug: 'crypto-etf-q1-2025',
        url: 'https://polymarket.com/crypto'
      },
      {
        id: '4',
        title: 'Will total crypto market cap exceed $5T in 2025?',
        question: 'Will total crypto market cap exceed $5T in 2025?',
        yesPrice: 45,
        noPrice: 55,
        volume: 1200000,
        liquidity: 280000,
        endDate: new Date(now + 240 * 24 * 60 * 60 * 1000).toISOString(),
        slug: 'crypto-5t-2025',
        url: 'https://polymarket.com/crypto'
      }
    ]

    return Response.json({
      predictions: fallbackPredictions,
      timestamp: new Date().toISOString(),
      isFallback: true
    })
  }
}
