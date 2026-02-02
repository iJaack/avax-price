'use client'

import { useEffect, useState } from 'react'

// Animated rolling digit component - Odometer style
function RollingDigit({ digit, prevDigit }: { digit: string; prevDigit: string }) {
  if (isNaN(parseInt(digit, 10))) {
    return <span className="inline-block">{digit}</span>
  }

  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <span className="inline-block relative overflow-hidden h-[1em]" style={{ width: '0.6em', verticalAlign: 'bottom' }}>
      <span
        className="flex flex-col absolute left-0 right-0 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ transform: `translateY(-${parseInt(digit, 10) * 10}%)` }}
      >
        {numbers.map((num) => (
          <span key={num} className="h-[1em] flex items-center justify-center tabular-nums">
            {num}
          </span>
        ))}
      </span>
    </span>
  )
}

interface AnimatedPriceProps {
  price: number
  className?: string
}

export function AnimatedPrice({ price, className }: AnimatedPriceProps) {
  const [prevPrice, setPrevPrice] = useState(price)
  const priceStr = price.toFixed(2)
  const prevPriceStr = prevPrice.toFixed(2)

  useEffect(() => {
    const timer = setTimeout(() => setPrevPrice(price), 350)
    return () => clearTimeout(timer)
  }, [price])

  const maxLen = Math.max(priceStr.length, prevPriceStr.length)
  const paddedCurrent = priceStr.padStart(maxLen, ' ')
  const paddedPrev = prevPriceStr.padStart(maxLen, ' ')

  return (
    <span className={className}>
      {paddedCurrent.split('').map((char, i) => (
        <RollingDigit key={i} digit={char} prevDigit={paddedPrev[i] || ' '} />
      ))}
    </span>
  )
}
