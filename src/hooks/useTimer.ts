import { useState, useEffect, useCallback, useRef } from 'react'

interface UseTimerOptions {
  duration: number // in seconds
  onComplete?: () => void
  autoStart?: boolean
}

export function useTimer({ duration, onComplete, autoStart = false }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Timer logic
  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          onCompleteRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback((newDuration?: number) => {
    setIsRunning(false)
    setTimeLeft(newDuration ?? duration)
  }, [duration])

  const restart = useCallback((newDuration?: number) => {
    setTimeLeft(newDuration ?? duration)
    setIsRunning(true)
  }, [duration])

  const percentage = (timeLeft / duration) * 100

  return {
    timeLeft,
    isRunning,
    percentage,
    start,
    pause,
    reset,
    restart
  }
}
