interface PriceDisplayProps {
  price: number | null
  change24h: number | null
}

export default function PriceDisplay({ price, change24h }: PriceDisplayProps) {
  return (
    <div className="text-center">
      <h1 className="text-gray-500 text-lg tracking-widest mb-8">AVAX</h1>
      <div className="text-7xl font-light tracking-tighter mb-2">
        <span className="text-gray-400">$</span>
        {price?.toFixed(2) || '0.00'}
      </div>
      {change24h !== null && (
        <div className={`text-lg mt-4 ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
        </div>
      )}
    </div>
  )
}
