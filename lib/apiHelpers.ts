/**
 * Pure helper functions extracted from API routes for testability.
 */

// ─── Leverage API helpers ──────────────────────────────────────────

export interface ExchangeData {
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

export function getDefaultExchangeData(exchange: string, error?: string): ExchangeData {
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
    _isFallback: true,
    _error: error,
  }
}

export function getFundingSentiment(fundingRate: number): string {
  if (fundingRate > 0.00005) return 'bullish'
  if (fundingRate >= 0) return 'neutral'  // 0 = balanced market, not bearish
  return 'bearish'
}

export function getOiSentiment(oiChange24h: number): string {
  if (oiChange24h > 2) return 'increasing'
  if (oiChange24h < -2) return 'decreasing'
  return 'stable'
}

// ─── Price API helpers ────────────────────────────────────────────

export interface PriceResponse {
  price: number
  change24h: number
  minPrice24h: number
  maxPrice24h: number
  marketCap: number
  volume24h: number
  history: Array<{ date: string; timestamp: number; price: number }>
  timestamp: string
  isFallback?: boolean
}

export function roundToTwo(val: number): number {
  return Math.round(val * 100) / 100
}

export function buildFallbackPriceResponse(): PriceResponse {
  const now = Date.now()
  const fallbackPrice = 14.50
  const history = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now - (29 - i) * 24 * 60 * 60 * 1000)
    return {
      date: date.toLocaleDateString('en-US'),
      timestamp: date.getTime(),
      price: fallbackPrice + (Math.random() - 0.5) * 2,
    }
  })
  return {
    price: fallbackPrice,
    change24h: -2.5,
    minPrice24h: roundToTwo(fallbackPrice * 0.98),
    maxPrice24h: roundToTwo(fallbackPrice * 1.02),
    marketCap: 6200000000,
    volume24h: 180000000,
    history,
    timestamp: new Date().toISOString(),
    isFallback: true,
  }
}

// ─── News RSS helpers ─────────────────────────────────────────────

export function extractRssTitle(item: string): string {
  const cdataMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = item.match(/<title>([^<]+)<\/title>/i)
  return plainMatch ? plainMatch[1].trim() : ''
}

export function extractRssLink(item: string): string {
  const cdataMatch = item.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = item.match(/<link>([^<]+)<\/link>/i)
  if (plainMatch) return plainMatch[1].trim()
  const guidMatch = item.match(/<guid[^>]*>([^<]+)<\/guid>/i)
  if (guidMatch && guidMatch[1].startsWith('http')) return guidMatch[1].trim()
  return '#'
}

export function extractRssDate(item: string): number {
  const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/i)
  return dateMatch ? new Date(dateMatch[1]).getTime() : Date.now()
}

export function isAvaxRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return lower.includes('avalanche') || /\bavax\b/.test(lower)
}

export function cleanGoogleNewsTitle(title: string, sourceName?: string): string {
  if (!sourceName) return title
  const suffix = ` - ${sourceName}`
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title
}
