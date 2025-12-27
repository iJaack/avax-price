'use client'

import { useMemo } from 'react'

interface ChartProps {
  data: Array<{ date: string; price: number }>
}

export default function Chart({ data }: ChartProps) {
  const chartDimensions = useMemo(() => {
    if (typeof window === 'undefined') {
      return { width: 900, height: 300, padding: 40 }
    }

    const isMobile = window.innerWidth < 768
    const isTablet = window.innerWidth < 1024

    if (isMobile) {
      return {
        width: Math.min(window.innerWidth - 32, 500),
        height: 200,
        padding: 20,
      }
    }

    if (isTablet) {
      return {
        width: Math.min(window.innerWidth - 64, 700),
        height: 250,
        padding: 30,
      }
    }

    return {
      width: Math.min(window.innerWidth - 128, 900),
      height: 300,
      padding: 40,
    }
  }, [])

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: `${chartDimensions.height}px`,
        }}
      >
        <p style={{ color: '#666' }}>Loading chart...</p>
      </div>
    )
  }

  const { width, height, padding } = chartDimensions
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const minPrice = Math.min(...data.map((d) => d.price))
  const maxPrice = Math.max(...data.map((d) => d.price))
  const range = maxPrice - minPrice || 1

  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * chartWidth + padding
    const y = height - ((point.price - minPrice) / range) * chartHeight - padding
    return { x, y }
  })

  let pathD = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const curr = points[i]
    const prev = points[i - 1]
    const next = i < points.length - 1 ? points[i + 1] : curr

    const cp1x = prev.x + (curr.x - prev.x) / 3
    const cp1y = prev.y + (curr.y - prev.y) / 3
    const cp2x = curr.x - (next.x - prev.x) / 3
    const cp2y = curr.y - (next.y - prev.y) / 3

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'auto',
      }}
    >
      <svg
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
          minWidth: '100%',
          maxWidth: '100%',
        }}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={pathD}
          fill="none"
          stroke="#8899cc"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
  }
