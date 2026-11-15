import { useCallback } from 'react'
import { useAnimationControls } from 'framer-motion'

// Give `controls` to a m.* element's animate prop, call shake() on error.
export default function useShake() {
  const controls = useAnimationControls()
  const shake = useCallback(
    () => controls.start({ x: [0, -7, 7, -5, 5, -2, 0], transition: { duration: 0.38 } }),
    [controls],
  )
  return [controls, shake]
}
