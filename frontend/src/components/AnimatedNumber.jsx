import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView'

function AnimatedNumber({ value, prefix = '', decimals = 2, duration = 900 }) {
  const [ref, inView] = useInView()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    let frame
    const start = performance.now()
    const from = 0
    const to = value

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(from + (to - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {prefix}{(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? value : display).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}

export default AnimatedNumber
