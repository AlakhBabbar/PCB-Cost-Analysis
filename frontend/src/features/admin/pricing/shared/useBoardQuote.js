import { useEffect, useRef, useState } from 'react'
import { priceBoard } from '../../../../api/pricingAdmin'
import { fitBoard } from '../model'

// Prices the board with the given config (null means the saved one), debounced.
export default function useBoardQuote(token, board, config, base) {
  const [state, setState] = useState({ result: null, error: null, loading: true })
  const seq = useRef(0)
  useEffect(() => {
    const id = ++seq.current
    setState((s) => ({ ...s, loading: true }))
    const t = setTimeout(() => {
      priceBoard(token, fitBoard(board, config ?? base), config).then(
        (result) => id === seq.current && setState({ result, error: null, loading: false }),
        (error) => id === seq.current && setState({ result: null, error, loading: false }),
      )
    }, 400)
    return () => clearTimeout(t)
  }, [token, board, config, base])
  return state
}

export const quoteProblem = (error) => {
  if (!error) return null
  if (Array.isArray(error.detail)) return { kind: 'config', text: 'Fix the marked values first, then the price shows here.' }
  if (error.status === 422) return { kind: 'blocked', text: error.message }
  return { kind: 'failed', text: error.message || 'Could not price this board.' }
}
