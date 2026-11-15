import { useCallback, useEffect, useRef, useState } from 'react'

// Runs fn() when deps change. Stale responses are dropped.
export default function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(() => fnRef.current())
      .then(
        (data) => live && setState({ data, error: null, loading: false }),
        (error) => live && setState((s) => ({ ...s, error, loading: false })),
      )
    return () => { live = false }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })), [])
  return { ...state, reload, setData }
}
