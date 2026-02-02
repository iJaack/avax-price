'use client'

import { useEffect, useState, useRef } from 'react'

export function useAnimatedValue(targetValue: number, duration: number = 500) {
  const [value, setValue] = useState(targetValue)
  const frameRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const startValueRef = useRef(targetValue)

  useEffect(() => {
    if (targetValue === value) return

    startValueRef.current = value
    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - (startTimeRef.current || currentTime)
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const newValue = startValueRef.current + (targetValue - startValueRef.current) * easeOut

      setValue(newValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [targetValue, duration])

  return value
}
