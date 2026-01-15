export const dynamic = 'force-dynamic'

interface BinanceFundingRate {
  symbol: string
  fundingRate: string
  fundingTime: number
}

interface BinanceOpenInterest {
  symbol: string
  openInterest: string
  time: number
}

interface BinanceLongShortRatio {
  symbol: string
  longShortRatio: string
  longAccount: string
  shortAccount: string
  timestamp: number
}

interface BinanceTakerVolume {
  buySellRatio: string
  buyVol: string
  sellVol: string
  timestamp: number
}

export async function GET() {
  try {
    const symbol = 'AVAXUSDT'

    // Fetch funding rate
    const fundingRes = await fetch(
      `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`,
      { cache: 'no-store' }
    )

    // Fetch open interest
    const oiRes = await fetch(
      `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`,
      { cache: 'no-store' }
    )

    // Fetch long/short ratio (top traders)
    const lsRes = await fetch(
      `https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=1h&limit=1`,
      { cache: 'no-store' }
    )

    // Fetch taker buy/sell volume
    const takerRes = await fetch(
      `https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=${symbol}&period=1h&limit=1`,
      { cache: 'no-store' }
    )

    let fundingRate = 0.0001
    let openInterest = 0
    let longShortRatio = 1.0
    let takerRatio = 1.0

    if (fundingRes.ok) {
      const data: BinanceFundingRate[] = await fundingRes.json()
      if (data.length > 0) {
        fundingRate = parseFloat(data[0].fundingRate)
      }
    }

    if (oiRes.ok) {
      const data: BinanceOpenInterest = await oiRes.json()
      openInterest = parseFloat(data.openInterest)
    }

    if (lsRes.ok) {
      const data: BinanceLongShortRatio[] = await lsRes.json()
      if (data.length > 0) {
        longShortRatio = parseFloat(data[0].longShortRatio)
      }
    }

    if (takerRes.ok) {
      const data: BinanceTakerVolume[] = await takerRes.json()
      if (data.length > 0) {
        takerRatio = parseFloat(data[0].buySellRatio)
      }
    }

    // Get current price for OI in USD
    const priceRes = await fetch(
      `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
      { cache: 'no-store' }
    )

    let price = 14
    if (priceRes.ok) {
      const priceData = await priceRes.json()
      price = parseFloat(priceData.price)
    }

    const oiUsd = openInterest * price

    // Determine sentiments
    const fundingSentiment = fundingRate > 0.0001 ? 'bullish' : fundingRate > 0 ? 'slightly bullish' : fundingRate < -0.0001 ? 'bearish' : 'slightly bearish'
    const oiSentiment = 'stable' // Would need historical data to determine change
    const positionSentiment = longShortRatio > 1.5 ? 'heavy longs' : longShortRatio > 1 ? 'more longs' : longShortRatio < 0.67 ? 'heavy shorts' : 'more shorts'
    const takerSentiment = takerRatio > 1 ? 'buyers lead' : 'sellers lead'

    return Response.json({
      fundingRate: (fundingRate * 100).toFixed(4),
      fundingSentiment,
      openInterestUsd: oiUsd,
      oiSentiment,
      longShortRatio: longShortRatio.toFixed(2),
      positionSentiment,
      takerRatio: takerRatio.toFixed(2),
      takerSentiment,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Leverage API error:', error)

    // Return fallback data
    return Response.json({
      fundingRate: '0.0012',
      fundingSentiment: 'slightly bullish',
      openInterestUsd: 245000000,
      oiSentiment: 'stable',
      longShortRatio: '1.85',
      positionSentiment: 'heavy longs',
      takerRatio: '1.12',
      takerSentiment: 'buyers lead',
      timestamp: new Date().toISOString(),
      isFallback: true
    })
  }
}
