'use client'
import { useMemo, useState } from 'react'

interface NewsItem {
  title: string
  description: string
  date: string
  timestamp: number
  url: string
  source: string
}

interface ChartProps {
  data: Array<{ date: string; price: number }>
  news?: NewsItem[]
}

export default function Chart({ data, news = [] }: ChartProps) {
  const [hoveredNews, setHoveredNews] = useState<NewsItem | null>(null)
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

  const { width, height, padding } = chartDimensions
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '300px',
        }}
      >
        <p style={{ color: '#666' }}>Loading chart...</p>
      </div>
    )
  }

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

    const cpix = prev.x + (curr.x - prev.x) / 3
    const cpiy = prev.y + (curr.y - prev.y) / 3
    const cp2x = curr.x - (next.x - prev.x) / 3
    const cp2y = curr.y - (next.y - prev.y) / 3

    pathD += ` C ${cpix} ${cpiy}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
  }

  // Map news items to chart coordinates
  const newsMarkers = news
    .map((newsItem) => {
      const newsDate = new Date(newsItem.date)
      const firstDate = new Date(data[0].date)
      const lastDate = new Date(data[data.length - 1].date)
      const totalDays =
        (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24) || 1
      const daysSinceStart =
        (newsDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceStart < 0 || daysSinceStart > totalDays) {
        return null
      }

      const progress = daysSinceStart / totalDays
      const x = progress * chartWidth + padding

      // Find the price at this date
      let y = chartHeight / 2 + padding
      const closestDataIndex = Math.round(progress * (data.length - 1))
      if (closestDataIndex >= 0 && closestDataIndex < data.length) {
        const price = data[closestDataIndex].price
        y = height - ((price - minPrice) / range) * chartHeight - padding
      }

      return { ...newsItem, x, y }
    })
    .filter((marker) => marker !== null) as (NewsItem & { x: number; y: number })[]

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <svg
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
          minWidth: '100%',
          overflow: 'visible',
        }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Grid lines and labels */}
        <g opacity="0.1">
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#888"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#888"
          />
        </g>

        {/* Price line */}
        <path
          d={pathD}
          stroke="#60a5fa"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* News markers */}
        {newsMarkers.map((marker, idx) => (
          <g key={idx}>
            {/* Vertical line from chart to marker */}
            <line
              x1={marker.x}
              y1={marker.y}
              x2={marker.x}
              y2={padding - 5}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              opacity="0.5"
            />
            {/* Marker circle */}
            <circle
              cx={marker.x}
              cy={padding - 15}
              r="5"
              fill="#ef4444"
              stroke="#fff"
              strokeWidth="2"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={() => setHoveredNews(marker)}
              onMouseLeave={() => setHoveredNews(null)}
            />
          </g>
        ))}
      </svg>

      {/* News tooltip */}
      {hoveredNews && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1a1a1a',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px 16px',
            maxWidth: '280px',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#ef4444',
              fontWeight: '600',
              marginBottom: '4px',
            }}
          >
            📰 NEWS
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '6px',
            }}
          >
            {hoveredNews.title}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#aaa',
              marginBottom: '6px',
              lineHeight: '1.4',
            }}
          >
            {hoveredNews.description}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#666',
              borderTop: '1px solid #333',
              paddingTop: '6px',
            }}
          >
            <div>{new Date(hoveredNews.date).toLocaleDateString('en-US')} · {new Date(hoveredNews.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ marginTop: '2px', color: '#888' }}>Source: {hoveredNews.source}</div>
          </div>
        </div>
      )}
    </div>
  )
}
