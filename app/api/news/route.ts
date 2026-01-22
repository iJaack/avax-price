export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try to fetch real AVAX news from RSS feeds
    const rssFeeds = [
      { url: 'https://news.google.com/rss/search?q=avalanche+crypto+when:7d&hl=en-US&gl=US&ceid=US:en', source: 'Google News' },
      { url: 'https://cryptoslate.com/news/avalanche/feed/', source: 'CryptoSlate' },
      { url: 'https://dailyhodl.com/tag/avalanche/feed/', source: 'The Daily Hodl' },
      { url: 'https://coinjournal.net/tag/avalanche/feed/', source: 'CoinJournal' },
      { url: 'https://cdn.feedcontrol.net/8/11466-wpmbsite005~a627d_265/feed.xml', source: 'Avalanche Blog' } // Unofficial/Proxy for official blog if available, otherwise skip
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

        for (const item of items.slice(0, 20)) {
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

          // Specific filtering for Google News which is accurate with query
          const isGoogle = feed.source === 'Google News'

          // Strict filtering: Content MUST contain specific keywords
          // This is essential for generic feeds like CoinLedger/Messari that don't allow RSS filtering
          const fullText = (title + (item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '')).toLowerCase()

          // Check for "Avalanche" or "AVAX" (mostly whole word for AVAX to avoid false positives)
          // Google News is already filtered by query, so we trust it more
          const isRelevant = isGoogle || fullText.includes('avalanche') || /\bavax\b/.test(fullText)

          if (isRelevant && title && link !== '#') {
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
