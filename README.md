# AVAX Price Dashboard

Real-time Avalanche (AVAX) price tracking dashboard with animated price displays and exchange metrics.

## Features

- **Animated Price Ticker** — Odometer-style rolling digit animation
- **Exchange Metrics** — Funding rates, open interest, long/short ratios
- **Market Sentiment** — Color-coded bullish/bearish indicators
- **News Feed** — Crypto news aggregation
- **Real-time Updates** — Client-side polling for live data

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS**
- **Chart.js** for visualizations

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

## Project Structure

```
├── app/
│   ├── api/           # API routes
│   │   ├── leverage/  # Funding/OI data
│   │   ├── news/      # News feed
│   │   └── price/     # Price data
│   ├── page.tsx       # Main dashboard
│   ├── layout.tsx     # Root layout
│   └── globals.css    # Styles
├── lib/               # Utilities
└── scripts/           # Debug/test scripts
```

## Environment Variables

Create `.env.local`:

```env
# Add any required API keys here
```

## Deployment

Optimized for Vercel deployment.

```bash
vercel --prod
```

## License

MIT
