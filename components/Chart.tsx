'use client'

export default function Chart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <p style={{ color: '#666' }}>Loading chart...</p>
      </div>
    )
  }

  const width = 900
  const height = 300
  const padding = 40

  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const minPrice = Math.min(...data.map((d: any) => d.price))
  const maxPrice = Math.max(...data.map((d: any) => d.price))
  const range = maxPrice - minPrice || 1

  const points = data.map((point: any, index: number) => {
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
    <svg
      style={{ width: '100%', height: '100%', display: 'block' }}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
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
  )
}
