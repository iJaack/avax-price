export async function GET() {
  try {
    // Fetch real AVAX news from RSS feeds
    const rssFeeds = [
      'https://medium.com/feed/@avalancheavax',
      'https://cryptoslate.com/news/avalanche/?feed=rss',
    ]

    const newsItems = []

    for (const feedUrl of rssFeeds) {
      try {
        const response = await fetch(feedUrl)
        const feedText = await response.text()

        // Parse RSS feed using regex to extract items
        const items = feedText.match(/<item>.*?<\/item>/gs) || []

        for (const item of items.slice(0, 5)) {
          const titleMatch = item.match(/<title>([^<]+)<\/title>/)
          const descMatch = item.match(/<description>([^<]+)<\/description>/)
          const linkMatch = item.match(/<link>([^<]+)<\/link>/)
          const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/)

          if (titleMatch && descMatch && pubDateMatch) {
            try {
              const pubDate = new Date(pubDateMatch[1])
              newsItems.push({
                title: titleMatch[1].substring(0, 100),
                description: descMatch[1].substring(0, 200),
                date: pubDate.toISOString(),
                timestamp: pubDate.getTime(),
                url: linkMatch ? linkMatch[1] : '#',
                source: feedUrl.includes('medium') ? 'Avalanche Medium' : 'CryptoSlate'
              })
            } catch (e) {
              // Skip items with invalid dates
            }
          }
        }
      } catch (feedError) {
        console.log(`Error fetching ${feedUrl}:`, feedError)
      }
    }

    // Sort by date (newest first) and limit to 10
    const sortedNews = newsItems
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    // If we got real news, return it
    if (sortedNews.length > 0) {
      return Response.json({
        news: sortedNews,
        timestamp: new Date().toISOString()
      })
    }

    // Fallback to sample data if RSS feeds fail
    const fallbackNews = [
      {
        title: 'Subnet Update Released',
        description: 'New Avalanche Subnet features and improvements released',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: Date.now() 310 * 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'Avalanche Team'
      },
      {
        title: 'Major Partnership Announcement',
        description: 'AVAX partners with major blockchain and financial institutions',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISO11ing(),
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'CoinGecko'
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
