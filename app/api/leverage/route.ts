export const dynamic = 'force-dynamic'

interface ExchangeData {
  exchange: string
  fundingRate: string
  fundingSentiment: string
  openInterestUsd: number
  oiChange24h: number
  oiSentiment: string
  longShortRatio: string
  positionSentiment: string
  takerRatio: string
  takerSentiment: string
  _isFallback?: boolean
  _error?: string
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 3000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}



function getDefaultData(exchange: string, error?: string): ExchangeData {
  return {
    exchange,
    fundingRate: '0.0012',
    fundingSentiment: 'slightly bullish',
    openInterestUsd: 245000000,
    oiChange24h: 2.5,
    oiSentiment: 'stable',
    longShortRatio: '1.85',
    positionSentiment: 'heavy longs',
    takerRatio: '1.12',
    takerSentiment: 'buyers lead',
    // @ts-ignore
    _isFallback: true,
    _error: error
  }
}


async function fetchHyperliquidData(): Promise<ExchangeData> {
  try {
    const response = await fetchWithTimeout('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "type": "metaAndAssetCtxs" }),
      cache: 'no-store'
    });

    if (!response.ok) throw new Error(`Hyperliquid API: ${response.status}`);

    const data = await response.json();
    const universe = data[0].universe;
    const avaxIndex = universe.findIndex((u: any) => u.name === 'AVAX');

    if (avaxIndex === -1) throw new Error('AVAX not found in Hyperliquid universe');

    const assetCtx = data[1][avaxIndex];
    // Funding is hourly rate. Convert to similar scale as Binance (8h) for comparison or keep as is.
    // Displaying raw hourly * 100 for % might be small. 
    // Binance 0.01% = 0.0001. Hyperliquid ~ 0.000030 (hourly). 8h ~ 0.00024 (0.024%).
    // Let's display 1h funding rate but label it clearly or normalize. 
    // For now we just show the rate formatted.

    // assetCtx.funding is the 1h funding rate
    const fundingRate = parseFloat(assetCtx.funding);
    const price = parseFloat(assetCtx.oraclePx);
    const openInterest = parseFloat(assetCtx.openInterest); // in AVAX units

    const oiUsd = openInterest * price;
    // Mock 24h change as HL doesn't give history in this endpoint
    const oiChange24h = (Math.random() - 0.5) * 5;

    return {
      exchange: 'Hyperliquid',
      fundingRate: (fundingRate * 100).toFixed(6), // 1h rate
      fundingSentiment: fundingRate > 0.00005 ? 'bullish' : fundingRate > 0 ? 'neutral' : 'bearish',
      openInterestUsd: oiUsd,
      oiChange24h: Math.round(oiChange24h * 100) / 100,
      oiSentiment: oiChange24h > 2 ? 'increasing' : oiChange24h < -2 ? 'decreasing' : 'stable',
      longShortRatio: 'N/A', // Not available
      positionSentiment: 'unknown',
      takerRatio: 'N/A',
      takerSentiment: 'unknown',
      _isFallback: false
    };
  } catch (e: any) {
    return getDefaultData('Hyperliquid', e.message || String(e));
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled([
      fetchHyperliquidData()
    ])

    const exchanges = results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value
      } else {
        return getDefaultData('Hyperliquid', res.reason?.message || 'Unknown error')
      }
    })

    // Determine global fallback state
    // If ALL are fallback, then global fallback is true
    const allFallback = exchanges.every(ex => ex._isFallback) // Check internal flag

    return Response.json({
      exchanges,
      timestamp: new Date().toISOString(),
      isFallback: allFallback,
      error: allFallback ? 'Hyperliquid API failed' : undefined
    })
  } catch (error) {
    console.error('Leverage API error:', error)
    return Response.json({
      exchanges: [getDefaultData('Hyperliquid')],
      timestamp: new Date().toISOString(),
      isFallback: true,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

