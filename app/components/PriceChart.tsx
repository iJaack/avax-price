'use client'

import { useState, useMemo } from 'react'

interface HistoryPoint {
  price: number
  timestamp: number
}

interface Candle {
  open: number
  high: number
  low: number
  close: number
  timestamp: number
  isGreen: boolean
}

interface PriceChartProps {
  history: HistoryPoint[]
  chartType: 'line' | 'candle'
  isTransitioning: boolean
}

function generateCandles(history: HistoryPoint[]): Candle[] {
  if (!history || history.length < 2) return []

  const candles: Candle[] = []
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1]
    const curr = history[i]
    const open = prev.price
    const close = curr.price
    const high = Math.max(open, close)
    const low = Math.min(open, close)

    candles.push({
      open,
      high,
      low,
      close,
      timestamp: curr.timestamp,
      isGreen: close >= open
    })
  }
  return candles
}

export function PriceChart({ history, chartType, isTransitioning }: PriceChartProps) {
  const [hoverData, setHoverData] = useState<{
    price: number
    timestamp: number
    x: number
    y: number
  } | null>(null)

  const chartData = useMemo(() => {
    if (!history.length) return { path: '', min: 0, max: 0, mid: 0 }
    const prices = history.map(h => h.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const mid = (min + max) / 2
    const range = max - min || 1

    const points = history.map((h, i) => ({
      x: (i / (history.length - 1)) * 100,
      y: 100 - ((h.price - min) / range) * 100
    }))

    if (points.length < 2) return { path: '', min, max, mid }

    let path = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      path += ` Q ${prev.x},${prev.y} ${cpx},${(prev.y + curr.y) / 2}`
    }
    const last = points[points.length - 1]
    path += ` L ${last.x},${last.y}`

    return { path, min, max, mid }
  }, [history])

  const candles = useMemo(() => generateCandles(history), [history])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!history.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const index = Math.min(
      Math.max(0, Math.floor((x / rect.width) * history.length)),
      history.length - 1
    )
    const point = history[index]
    if (!point) return

    const min = chartData.min
    const range = (chartData.max - chartData.min) || 1
    const yPos = 100 - ((point.price - min) / range) * 100

    setHoverData({
      price: point.price,
      timestamp: point.timestamp,
      x: (index / (history.length - 1)) * 100,
      y: yPos
    })
  }

  return (
    <div className="relative h-48">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <line x1="0" y1="0" x2="100" y2="0" stroke="#262626" strokeWidth="0.3" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#262626" strokeWidth="0.3" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="#262626" strokeWidth="0.3" />

        {chartType === 'line' && (
          <path
            d={chartData.path}
            fill="none"
            stroke="#737373"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
            className={`transition-all duration-700 ease-out ${isTransitioning ? 'opacity-30' : 'opacity-100'}`}
          />
        )}

        {chartType === 'candle' && candles.map((candle, i) => {
          const min = chartData.min
          const range = (chartData.max - chartData.min) || 1
          const historyIndex = i + 1
          const x = (historyIndex / (history.length - 1)) * 100
          const calculatedW = (100 / candles.length) * 0.7
          const w = Math.min(calculatedW, 2.5)
          const yHigh = 100 - ((candle.high - min) / range) * 100
          const yLow = 100 - ((candle.low - min) / range) * 100
          const yOpen = 100 - ((candle.open - min) / range) * 100
          const yClose = 100 - ((candle.close - min) / range) * 100
          const yBodyTop = Math.min(yOpen, yClose)
          const bodyHeight = Math.abs(yClose - yOpen) || 0.5

          return (
            <g key={i} className={`transition-opacity duration-500 ${isTransitioning ? 'opacity-30' : 'opacity-100'}`}>
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candle.isGreen ? '#22c55e' : '#ef4444'} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
              <rect x={x - w / 2} y={yBodyTop} width={w} height={bodyHeight} fill={candle.isGreen ? '#22c55e' : '#ef4444'} />
            </g>
          )
        })}
      </svg>

      <div
        className="absolute inset-0 z-20 cursor-crosshair touch-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
      />

      {hoverData && (
        <>
          <div className="absolute top-0 bottom-0 w-px bg-neutral-700/50 pointer-events-none" style={{ left: `${hoverData.x}%` }} />
          {chartType === 'line' && (
            <div
              className="absolute w-2 h-2 bg-white rounded-full -ml-1 -mt-1 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.5)] z-30"
              style={{ left: `${hoverData.x}%`, top: `${hoverData.y}%` }}
            />
          )}
          <div
            className="absolute bg-neutral-900/90 border border-neutral-800 rounded p-2 text-xs pointer-events-none z-30 tabular-nums shadow-xl backdrop-blur-sm whitespace-nowrap"
            style={{
              left: `${hoverData.x}%`,
              top: `${hoverData.y}%`,
              transform: `translate(${hoverData.x > 50 ? 'calc(-100% - 15px)' : '15px'}, -50%)`
            }}
          >
            <div className="text-neutral-400 mb-0.5">
              {new Date(hoverData.timestamp).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </div>
            <div className="text-white font-medium text-sm">
              ${hoverData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </>
      )}

      <div className={`absolute right-0 top-0 bottom-0 flex flex-col justify-between text-xs text-neutral-600 -mr-10 py-1 transition-opacity duration-500 ${isTransitioning ? 'opacity-30' : 'opacity-100'}`}>
        <span>${chartData.max.toFixed(2)}</span>
        <span>${chartData.mid.toFixed(2)}</span>
        <span>${chartData.min.toFixed(2)}</span>
      </div>
    </div>
  )
}
