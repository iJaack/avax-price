export default function Chart({ data }: { data: any[] }) {
  return (
    <div className="h-64 w-full">
      {data && data.length > 0 ? (
        <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          {data.map((point, index) => {
            const x = (index / Math.max(data.length - 1, 1)) * 100
            const minPrice = Math.min(...data.map(d => d.price))
            const maxPrice = Math.max(...data.map(d => d.price))
            const range = maxPrice - minPrice || 1
            const y = 60 - ((point.price - minPrice) / range) * 50
            return (
              <circle key={index} cx={x} cy={y} r="0.5" fill="#64748b" />
            )
          })}
          <polyline
            points={data.map((point, index) => {
              const x = (index / Math.max(data.length - 1, 1)) * 100
              const minPrice = Math.min(...data.map(d => d.price))
              const maxPrice = Math.max(...data.map(d => d.price))
              const range = maxPrice - minPrice || 1
              const y = 60 - ((point.price - minPrice) / range) * 50
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#64748b"
            strokeWidth="0.3"
          />
        </svg>
      ) : (
        <div className="text-center text-gray-500">Loading chart...</div>
      )}
    </div>
  )
}
