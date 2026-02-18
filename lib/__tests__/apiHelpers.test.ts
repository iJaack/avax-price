import { describe, it, expect } from 'vitest'
import {
  getDefaultExchangeData,
  getFundingSentiment,
  getOiSentiment,
  roundToTwo,
  buildFallbackPriceResponse,
  extractRssTitle,
  extractRssLink,
  extractRssDate,
  isAvaxRelevant,
  cleanGoogleNewsTitle,
} from '../apiHelpers'

// ─── Leverage helpers ─────────────────────────────────────────────

describe('getDefaultExchangeData', () => {
  it('returns fallback with correct exchange name', () => {
    const d = getDefaultExchangeData('Hyperliquid')
    expect(d.exchange).toBe('Hyperliquid')
    expect(d._isFallback).toBe(true)
  })

  it('includes error message when provided', () => {
    const d = getDefaultExchangeData('Binance', 'timeout')
    expect(d._error).toBe('timeout')
  })

  it('returns sensible default numeric values', () => {
    const d = getDefaultExchangeData('Test')
    expect(d.openInterestUsd).toBeGreaterThan(0)
    expect(Number(d.fundingRate)).toBeGreaterThan(0)
    expect(Number(d.longShortRatio)).toBeGreaterThan(0)
  })

  it('_error is undefined when not provided', () => {
    const d = getDefaultExchangeData('X')
    expect(d._error).toBeUndefined()
  })
})

describe('getFundingSentiment', () => {
  it('returns bullish above 0.00005', () => {
    expect(getFundingSentiment(0.0001)).toBe('bullish')
    expect(getFundingSentiment(0.00005 + 0.000001)).toBe('bullish')
  })

  it('returns neutral between 0 and 0.00005 (inclusive)', () => {
    expect(getFundingSentiment(0.00005)).toBe('neutral')
    expect(getFundingSentiment(0.00001)).toBe('neutral')
    expect(getFundingSentiment(0)).toBe('neutral')
  })

  it('returns bearish for negative rates', () => {
    expect(getFundingSentiment(-0.0001)).toBe('bearish')
    expect(getFundingSentiment(-0.00001)).toBe('bearish')
  })
})

describe('getOiSentiment', () => {
  it('returns increasing above 2', () => {
    expect(getOiSentiment(3)).toBe('increasing')
    expect(getOiSentiment(2.1)).toBe('increasing')
  })

  it('returns decreasing below -2', () => {
    expect(getOiSentiment(-3)).toBe('decreasing')
    expect(getOiSentiment(-2.1)).toBe('decreasing')
  })

  it('returns stable between -2 and 2 inclusive', () => {
    expect(getOiSentiment(2)).toBe('stable')
    expect(getOiSentiment(-2)).toBe('stable')
    expect(getOiSentiment(0)).toBe('stable')
    expect(getOiSentiment(1.9)).toBe('stable')
  })
})

// ─── Price helpers ────────────────────────────────────────────────

describe('roundToTwo', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundToTwo(14.566)).toBe(14.57)
    expect(roundToTwo(14.564)).toBe(14.56)
    expect(roundToTwo(14.5)).toBe(14.5)
  })

  it('handles integers', () => {
    expect(roundToTwo(100)).toBe(100)
  })

  it('handles negative values', () => {
    // IEEE 754: Math.round(-255.5) = -255 (rounds toward +∞), so -2.555 → -2.55
    // But Math.round(-256.5) would be -256. Just confirm it returns a number.
    expect(roundToTwo(-2.5)).toBe(-2.5)
    expect(roundToTwo(-14.566)).toBe(-14.57)
  })

  it('handles zero', () => {
    expect(roundToTwo(0)).toBe(0)
  })
})

describe('buildFallbackPriceResponse', () => {
  it('returns isFallback: true', () => {
    expect(buildFallbackPriceResponse().isFallback).toBe(true)
  })

  it('returns exactly 30 history items', () => {
    expect(buildFallbackPriceResponse().history).toHaveLength(30)
  })

  it('history items are in ascending timestamp order', () => {
    const { history } = buildFallbackPriceResponse()
    for (let i = 1; i < history.length; i++) {
      expect(history[i].timestamp).toBeGreaterThan(history[i - 1].timestamp)
    }
  })

  it('price is a positive number', () => {
    expect(buildFallbackPriceResponse().price).toBeGreaterThan(0)
  })

  it('minPrice24h < price < maxPrice24h', () => {
    const r = buildFallbackPriceResponse()
    expect(r.minPrice24h).toBeLessThan(r.price)
    expect(r.maxPrice24h).toBeGreaterThan(r.price)
  })

  it('has valid ISO timestamp', () => {
    const ts = buildFallbackPriceResponse().timestamp
    expect(() => new Date(ts)).not.toThrow()
    expect(new Date(ts).getTime()).toBeGreaterThan(0)
  })
})

// ─── RSS helpers ──────────────────────────────────────────────────

describe('extractRssTitle', () => {
  it('extracts CDATA title', () => {
    const item = '<title><![CDATA[AVAX hits $50]]></title>'
    expect(extractRssTitle(item)).toBe('AVAX hits $50')
  })

  it('extracts plain title', () => {
    const item = '<title>Avalanche News Today</title>'
    expect(extractRssTitle(item)).toBe('Avalanche News Today')
  })

  it('returns empty string when no title found', () => {
    expect(extractRssTitle('<item><link>http://x.com</link></item>')).toBe('')
  })

  it('trims whitespace', () => {
    const item = '<title><![CDATA[  Spaced Title  ]]></title>'
    expect(extractRssTitle(item)).toBe('Spaced Title')
  })
})

describe('extractRssLink', () => {
  it('extracts CDATA link', () => {
    const item = '<link><![CDATA[https://example.com/story]]></link>'
    expect(extractRssLink(item)).toBe('https://example.com/story')
  })

  it('extracts plain link', () => {
    const item = '<link>https://example.com/avax-news</link>'
    expect(extractRssLink(item)).toBe('https://example.com/avax-news')
  })

  it('falls back to guid when no link tag', () => {
    const item = '<guid isPermaLink="true">https://example.com/guid-url</guid>'
    expect(extractRssLink(item)).toBe('https://example.com/guid-url')
  })

  it('returns # when nothing found', () => {
    expect(extractRssLink('<item><title>No link</title></item>')).toBe('#')
  })

  it('ignores non-URL guid', () => {
    const item = '<guid>not-a-url-12345</guid>'
    expect(extractRssLink(item)).toBe('#')
  })
})

describe('extractRssDate', () => {
  it('parses RFC-2822 pubDate', () => {
    const item = '<pubDate>Mon, 18 Feb 2026 10:00:00 GMT</pubDate>'
    const ts = extractRssDate(item)
    expect(ts).toBe(new Date('Mon, 18 Feb 2026 10:00:00 GMT').getTime())
  })

  it('returns a positive number when no date found', () => {
    // Falls back to Date.now()
    expect(extractRssDate('<item></item>')).toBeGreaterThan(0)
  })
})

describe('isAvaxRelevant', () => {
  it('returns true for "avalanche"', () => {
    expect(isAvaxRelevant('Avalanche launches new subnet')).toBe(true)
  })

  it('is case-insensitive for avalanche', () => {
    expect(isAvaxRelevant('AVALANCHE price up 10%')).toBe(true)
  })

  it('returns true for whole-word AVAX', () => {
    expect(isAvaxRelevant('AVAX hits new high')).toBe(true)
  })

  it('does NOT match "avax" as substring in unrelated word', () => {
    // "avaxing" is not a word but test the boundary matcher
    expect(isAvaxRelevant('avaxing around')).toBe(false)
  })

  it('returns false for unrelated crypto text', () => {
    expect(isAvaxRelevant('Bitcoin surges to $100k')).toBe(false)
    expect(isAvaxRelevant('Ethereum merge complete')).toBe(false)
  })
})

describe('cleanGoogleNewsTitle', () => {
  it('strips trailing " - SourceName"', () => {
    const title = 'AVAX surges 10% - CoinDesk'
    expect(cleanGoogleNewsTitle(title, 'CoinDesk')).toBe('AVAX surges 10%')
  })

  it('leaves title unchanged if suffix not present', () => {
    const title = 'AVAX surges 10%'
    expect(cleanGoogleNewsTitle(title, 'CoinDesk')).toBe('AVAX surges 10%')
  })

  it('leaves title unchanged when no sourceName', () => {
    expect(cleanGoogleNewsTitle('AVAX surges 10%')).toBe('AVAX surges 10%')
  })

  it('handles partial suffix match (different source)', () => {
    const title = 'AVAX surges 10% - TheBlock'
    expect(cleanGoogleNewsTitle(title, 'CoinDesk')).toBe('AVAX surges 10% - TheBlock')
  })
})
