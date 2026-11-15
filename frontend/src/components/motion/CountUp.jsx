import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import usePrefersReducedMotion from './usePrefersReducedMotion'

const easeOutCubic = (t) => 1 - (1 - t) ** 3
const plain = (v) => Math.round(v).toLocaleString('en-IN')

export default function CountUp({ value, format = plain, className = '' }) {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  const target = Number(value)

  useEffect(() => {
    if (value == null || Number.isNaN(target)) return
    const ctl = animate(from.current, target, {
      duration: reduced ? 0 : 0.52,
      ease: easeOutCubic,
      onUpdate: setShown,
    })
    return () => { from.current = target; ctl.stop() }
  }, [value, target, reduced])

  return <span className={`tabular-nums ${className}`}>{value == null ? '-' : format(shown)}</span>
}
