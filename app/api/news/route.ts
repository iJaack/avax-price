export async function GET() {
  try {
    // Fetch latest AVAX news from CoinGecko API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/news?category=avalanche',
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    const newsData = await response.json()

    // Map news to include dates and filter for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentNews = newsData.data
      ?.filter((item: any) => {
        if (!item.updated_at) return false
        const newsDate = new Date(item.updated_at)
        return newsDate >= thirtyDaysAgo
      })
      .map((item: any) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        source: item.source_info?.name || item.source,
        image: item.image?.small || item.image?.thumb,
        date: new Date(item.updated_at).toISOString(),
        timestamp: new Date(item.updated_at).getTime()
      }))
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 10) // Get top 10 recent news

    return Response.json({
      news: recentNews || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    // Return mock data on error (for demo purposes)
    return Response.json({
      news: [
        {
          title: 'AVAX Mainnet Live',
          description: 'Avalanche mainnet is operational',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
          url: '#',
          source: 'Avalanche Team'
        },
        {
          title: 'Subnet Update',
          description: 'New Avalanche Subnet features released',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
          url: '#',
          source: 'Avalanche Team'
        },
        {
          title: 'Major Partnership',
          description: 'AVAX partners with major blockchain projects',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
          url: '#',
          source: 'CoinGecko'
        }
      ],
      timestamp: new Date().toISOString()
    })
  }
}
