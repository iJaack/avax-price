export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendPrice = async () => {
        try {
          // Fetch current price from CoinGecko
          const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd&include_24hr_change=true',
            { cache: 'no-store' }
          )

          if (!response.ok) throw new Error('CoinGecko API failed')
          const priceData = await response.json()
          const price = priceData['avalanche-2'].usd
          const change24h = priceData['avalanche-2'].usd_24h_change

          const data = {
            price: Math.round(price * 100) / 100,
            change24h: Math.round(change24h * 100) / 100,
            timestamp: new Date().toISOString()
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error('Error fetching price:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to fetch price' })}\n\n`))
        }
      }

      // Send initial price immediately
      await sendPrice()

      // Then update every 3 seconds (CoinGecko free tier rate limit friendly)
      const interval = setInterval(sendPrice, 3000)

      // Cleanup on close
      return () => {
        clearInterval(interval)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
