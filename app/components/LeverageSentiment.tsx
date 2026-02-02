'use client'

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

interface LeverageSentimentProps {
  exchanges: ExchangeData[]
  selectedExchange: number
  onSelectExchange: (index: number) => void
}

export function LeverageSentiment({ exchanges, selectedExchange, onSelectExchange }: LeverageSentimentProps) {
  const ex = exchanges[selectedExchange]
  if (!ex) return null

  return (
    <div className="mb-8">
      <h2 className="text-xs text-neutral-500 font-semibold tracking-wide mb-3">LEVERAGE SENTIMENT</h2>
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            {exchanges.map((exchange, idx) => (
              <button
                key={exchange.exchange}
                onClick={() => onSelectExchange(idx)}
                className={`text-sm px-3 py-1 rounded transition-all duration-200 ${
                  selectedExchange === idx ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {exchange.exchange}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-neutral-600 flex items-center gap-1">
            via {ex.exchange}
            {ex._isFallback && (
              <span className="text-red-500 cursor-help" title={`Data fetch failed. ${ex._error || 'Unknown'}`}>(!)</span>
            )}
          </span>
        </div>

        {ex._isFallback && (
          <div className="mb-3 px-3 py-2 bg-red-900/20 border border-red-900/50 rounded-lg">
            <p className="text-[10px] text-red-400 font-mono">API Error: {ex._error || 'Unknown error'}</p>
            <p className="text-[9px] text-red-500/70 mt-0.5">Showing default demonstration data.</p>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
            <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${
              ex.fundingSentiment.includes('bullish') ? 'text-green-500' : 
              ex.fundingSentiment.includes('bearish') ? 'text-red-500' : 'text-neutral-400'
            }`}>
              {ex.fundingSentiment}
            </div>
            <div className="text-white text-sm font-semibold">{parseFloat(ex.fundingRate) >= 0 ? '+' : ''}{ex.fundingRate}%</div>
            <div className="text-[9px] text-neutral-600 mt-1">FUNDING RATE</div>
          </div>

          <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
            <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${
              ex.oiChange24h > 2 ? 'text-green-500' : ex.oiChange24h < -2 ? 'text-red-500' : 'text-neutral-400'
            }`}>
              {ex.oiChange24h > 0 ? '+' : ''}{ex.oiChange24h.toFixed(1)}% 24h
            </div>
            <div className="text-white text-sm font-semibold">${(ex.openInterestUsd / 1e6).toFixed(0)}M</div>
            <div className="text-[9px] text-neutral-600 mt-1">OPEN INTEREST</div>
          </div>

          <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
            <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${
              ex.positionSentiment.includes('long') ? 'text-green-500' : 'text-red-500'
            }`}>
              {ex.positionSentiment}
            </div>
            <div className="text-white text-sm font-semibold">{ex.longShortRatio} L/S</div>
            <div className="text-[9px] text-neutral-600 mt-1">POSITIONING</div>
          </div>

          <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
            <div className={`text-[11px] font-medium mb-1 transition-colors duration-300 ${
              ex.takerSentiment.includes('buyers') ? 'text-green-500' : 'text-red-500'
            }`}>
              {ex.takerSentiment}
            </div>
            <div className="text-white text-sm font-semibold">{ex.takerRatio}</div>
            <div className="text-[9px] text-neutral-600 mt-1">TAKER FLOW</div>
          </div>
        </div>
      </div>
    </div>
  )
}
