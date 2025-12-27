export async function GET() {
  try {
    // For now, return mock news data directly
    // This ensures we always have news to display on the chart
    const mockNews = [
      {
        title: 'AVAX Mainnet Live',
        description: 'Avalanche mainnet is operational and processing transactions',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'Avalanche Team'
      },
      {
        title: 'Subnet Update Released',
        description: 'New Avalanche Subnet features and improvements released',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'Avalanche Team'
      },
      {
        title: 'Major Partnership Announcement',
        description: 'AVAX partners with major blockchain and financial institutions',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'CoinGecko'
      },
      {
        title: 'Network Upgrade Completed',
        description: 'Avalanche completes network upgrade with enhanced security',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'Avalanche Team'
      },
      {
        title: 'DeFi Integration Success',
        description: 'Major DeFi protocol integrates with Avalanche ecosystem',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        url: 'https://avalanche.network',
        source: 'DeFi News'
      }
    ]

    return Response.json({
      news: mockNews,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in news endpoint:', error)
    // Return fallback mock data even on error
    return Response.json({
      news: [
        {
          title: 'AVAX Mainnet Live',
          description: 'Avalanche mainnet is operational',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
          url: '#',
          source: 'Avalanche'
        }
      ],
      timestamp: new Date().toISOString()
    })
  }
}
