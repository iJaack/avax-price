'use client'
import { useMemo } from 'react'

interface ChartProps {
  data: Array<{ date: string; timestamp?: number; price: number }>
  color?: string
}

export default function Chart({ data, color = '#E84142' }: ChartProps) {
  const chartDimensions = useMemo(() => {
    if (typeof window === 'undefined') {
      return { width: 600, height: 200 }
    }
    const isMobile = window.innerWidth < 640
    return {
      width: isMobile ? Math.min(window.innerWidth - 48, 400) : 600,
      height: isMobile ? 150 : 200,
    }
  }, [])

  const { width, height } = chartDimensions
  const padding = { top: 20, right: 10, bottom: 30, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-[200px]">
        <p className="text-zinc-600 text-sm">Loading chart...</p>
      </div>
    )
  }

  const prices = data.map(d => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const range = maxPrice - minPrice || 1

  // Create points
  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * chartWidth + padding.left
    const y = padding.top + chartHeight - ((point.price - minPrice) / range) * chartHeight
    return { x, y }
  })

  // Create smooth path
  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const curr = points[i]
    const prev = points[i - 1]
    const cpx = (prev.x + curr.x) / 2
    pathD += ` Q ${prev.x + (curr.x - prev.x) / 4} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`
    pathD += ` Q ${curr.x - (curr.x - prev.x) / 4} ${curr.y}, ${curr.x} ${curr.y}`
  }

  // Create gradient area path
  const areaPath = pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#chartGradient)"
        />

        {/* Line */}
        <path
          d={pathD}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current price dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill={color}
        />
      </svg>
    </div>
  )
}
