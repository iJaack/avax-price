export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try to fetch real AVAX news from RSS feeds
    const rssFeeds = [
      { url: 'https://cointelegraph.com/rss/tag/avalanche', source: 'CoinTelegraph' },
      { url: 'https://cryptoslate.com/news/avalanche/?feed=rss', source: 'CryptoSlate' },
    ]

    const newsItems: Array<{ title: string; source: string; url: string; timestamp: number }> = []

    for (const feed of rssFeeds) {
      try {
        const response = await fetch(feed.url, {
          cache: 'no-store',
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'Mozilla/5.0 (compatible; AVAXPriceBot/1.0)'
          }
        })

        if (!response.ok) continue

        const text = await response.text()
        const items = text.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []

        for (const item of items.slice(0, 5)) {
          // Extract title - handle CDATA and plain text
          const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
                            item.match(/<title>([^<]+)<\/title>/i)
          const title = titleMatch ? titleMatch[1].trim() : ''

          // Extract link - try multiple patterns
          // Pattern 1: <link>URL</link>
          // Pattern 2: <link><![CDATA[URL]]></link>
          // Pattern 3: <link /> followed by URL (some RSS feeds)
          // Pattern 4: <guid>URL</guid> as fallback
          let link = '#'

          const linkCdataMatch = item.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)
          const linkPlainMatch = item.match(/<link>([^<]+)<\/link>/i)
          const linkSelfClose = item.match(/<link\s*\/?>\s*(https?:\/\/[^\s<]+)/i)
          const guidMatch = item.match(/<guid[^>]*>([^<]+)<\/guid>/i)

          if (linkCdataMatch) {
            link = linkCdataMatch[1].trim()
          } else if (linkPlainMatch) {
            link = linkPlainMatch[1].trim()
          } else if (linkSelfClose) {
            link = linkSelfClose[1].trim()
          } else if (guidMatch && guidMatch[1].startsWith('http')) {
            link = guidMatch[1].trim()
          }

          // Extract pubDate
          const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/i)
          const timestamp = dateMatch ? new Date(dateMatch[1]).getTime() : Date.now()

          if (title && link !== '#') {
            newsItems.push({
              title: title.substring(0, 120),
              source: feed.source,
              url: link,
              timestamp
            })
          }
        }
      } catch (e) {
        console.error(`Error fetching ${feed.url}:`, e)
      }
    }

    // Sort by date and take top 6
    const sortedNews = newsItems
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6)

    if (sortedNews.length > 0) {
      return Response.json({
        news: sortedNews,
        timestamp: new Date().toISOString()
      })
    }

    // Fallback news with real URLs
    return Response.json({
      news: [
        { title: 'AVAX subnet activity reaches new highs with gaming integrations', source: 'CoinDesk', url: 'https://www.coindesk.com/search?q=avalanche' },
        { title: 'Avalanche Foundation launches ecosystem growth initiative', source: 'The Block', url: 'https://www.theblock.co/search?query=avalanche' },
        { title: 'Major DeFi protocol announces Avalanche expansion', source: 'Decrypt', url: 'https://decrypt.co/search?query=avalanche' },
        { title: 'AVAX staking rewards see increased participation', source: 'CryptoSlate', url: 'https://cryptoslate.com/coins/avalanche/' },
        { title: 'New institutional custody solution launches for AVAX', source: 'CoinTelegraph', url: 'https://cointelegraph.com/tags/avalanche' },
        { title: 'Avalanche network throughput hits record levels', source: 'CoinTelegraph', url: 'https://cointelegraph.com/tags/avalanche' },
      ],
      timestamp: new Date().toISOString(),
      isFallback: true
    })
  } catch (error) {
    console.error('News API error:', error)
    return Response.json({
      news: [],
      timestamp: new Date().toISOString()
    })
  }
}
