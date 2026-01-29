import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AVAX Price | Real-Time Avalanche Price',
  description: 'Track Avalanche (AVAX) price in real-time with market data and charts.',
  keywords: ['AVAX', 'Avalanche', 'crypto', 'price', 'market data', 'charts'],
  openGraph: {
    title: 'AVAX Price',
    description: 'Real-time Avalanche price tracker with market data and charts',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVAX Price',
    description: 'Real-time Avalanche price tracker with market data and charts',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23E84142'/><text y='50' x='50' font-size='40' text-anchor='middle' dominant-baseline='central' fill='white' font-weight='bold'>A</text></svg>" />
      </head>
      <body className="bg-black text-white antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
