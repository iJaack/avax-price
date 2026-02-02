'use client'

interface NewsItem {
  title: string
  source: string
  url: string
}

interface NewsSectionProps {
  news: NewsItem[]
  timestamp: number
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function NewsSection({ news, timestamp }: NewsSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs text-neutral-500 font-semibold tracking-wide">AI NEWS SUMMARY</h2>
        <span className="text-[10px] text-neutral-600">updated {formatTimeAgo(timestamp)}</span>
      </div>

      <div className="space-y-3">
        {news.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-green-500 mt-0.5">•</span>
            <div className="flex-1 flex justify-between items-baseline gap-3">
              <p className="text-sm text-neutral-300 leading-snug">{item.title}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-neutral-600 hover:text-neutral-400 whitespace-nowrap flex-shrink-0 transition-colors"
              >
                {item.source} ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
