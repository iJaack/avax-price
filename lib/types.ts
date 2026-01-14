// Domain Models
export interface NewsItem {
  title: string
  description: string
  date: string
  timestamp: number
  url: string
  source: string
}

export interface PriceData {
  price: number
  change24h: number
  minPrice24h: number
  maxPrice24h: number
  history: Array<{ date: string; timestamp: number; price: number }>
}

export interface PriceState {
  displayPrice: number | null
  basePrice: number | null
  change24h: number | null
  minPrice24h: number | null
  maxPrice24h: number | null
  priceHistory: Array<{ date: string; timestamp: number; price: number }>
  loading: boolean
  priceDirection: 'up' | 'down' | 'neutral'
}

export type PriceDirection = 'up' | 'down' | 'neutral'
