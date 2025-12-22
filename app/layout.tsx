import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AVAX Price',
  description: 'Real-time Avalanche (AVAX) price tracker',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" font-size="50" text-anchor="middle" dominant-baseline="central">⛓️</text></svg>'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">{children}</body>
    </html>
  )
}
