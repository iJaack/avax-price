// Helper function to clean HTML entities and CDATA
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim()
}

// Helper function to extract feed source name
function getFeedSource(feedUrl: string): string {
  if (feedUrl.includes('theblock.co')) return 'The Block'
  if (feedUrl.includes('coindesk.com')) return 'CoinDesk'
  if (feedUrl.includes('cointelegraph.com')) return 'Cointelegraph'
  if (feedUrl.includes('decrypt.co')) return 'Decrypt'
  return 'Crypto News'
}

export async function GET() {
  try {
    // Popular crypto news RSS feeds
    const rssFeeds = [
      'https://www.theblock.co/rss.xml',
      'https://www.coindesk.com/arc/outboundfeeds/rss/',
      'https://cointelegraph.com/rss',
      'https://decrypt.co/feed',
    ]

    const newsItems = []
    const fetchPromises = rssFeeds.map(async (feedUrl) => {
      try {
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
          },
          next: { revalidate: 300 } // Cache for 5 minutes
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const feedText = await response.text()

        // Parse RSS feed using regex to extract items
        const items = feedText.match(/<item>.*?<\/item>/gs) || []

        const parsedItems = []
        for (const item of items.slice(0, 5)) {
          // Extract title (handle CDATA)
          const titleMatch = item.match(/<title>(.*?)<\/title>/s)
          // Extract description (handle CDATA)
          const descMatch = item.match(/<description>(.*?)<\/description>/s)
          // Extract link
          const linkMatch = item.match(/<link>(.*?)<\/link>/s)
          // Extract pubDate
          const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/s)

          if (titleMatch && pubDateMatch) {
            try {
              const title = cleanText(titleMatch[1])
              const description = descMatch ? cleanText(descMatch[1]) : title
              const link = linkMatch ? cleanText(linkMatch[1]) : '#'
              const pubDate = new Date(pubDateMatch[1])

              // Only include recent news (last 30 days)
              if (Date.now() - pubDate.getTime() < 30 * 24 * 60 * 60 * 1000) {
                parsedItems.push({
                  title: title.substring(0, 120),
                  description: description.substring(0, 250),
                  date: pubDate.toISOString(),
                  timestamp: pubDate.getTime(),
                  url: link,
                  source: getFeedSource(feedUrl)
                })
              }
            } catch (e) {
              // Skip items with invalid dates
              console.log('Failed to parse news item:', e)
            }
          }
        }
        return parsedItems
      } catch (feedError) {
        console.log(`Error fetching ${feedUrl}:`, feedError)
        return []
      }
    })

    // Fetch all feeds in parallel
    const results = await Promise.all(fetchPromises)
    const allNewsItems = results.flat()

    // Sort by date (newest first) and limit to 15
    const sortedNews = allNewsItems
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15)

    // If we got real news, return it
    if (sortedNews.length > 0) {
      return Response.json({
        news: sortedNews,
        timestamp: new Date().toISOString()
      })
    }

    // Fallback to sample data if all RSS feeds fail
    const fallbackTimestamp = Date.now() - 3 * 24 * 60 * 60 * 1000
    const fallbackNews = [
      {
        title: 'Avalanche Network Reaches New Milestone',
        description: 'The Avalanche network continues to grow with increased adoption',
        date: new Date(fallbackTimestamp).toISOString(),
        timestamp: fallbackTimestamp,
        url: 'https://avalanche.network',
        source: 'Avalanche'
      },
      {
        title: 'DeFi Activity Surges on Avalanche',
        description: 'Decentralized finance protocols on Avalanche see significant growth',
        date: new Date(fallbackTimestamp - 24 * 60 * 60 * 1000).toISOString(),
        timestamp: fallbackTimestamp - 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'Crypto News'
      }
    ]

    return Response.json({
      news: fallbackNews,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in news endpoint:', error)
    return Response.json({
      news: [],
      timestamp: new Date().toISOString()
    })
  }
}
