import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export const PAGE_SIZE = 25

// List state (tab, q, page) lives in the URL so back and refresh keep it.
export default function useListParams() {
  const [params, setParams] = useSearchParams()
  const get = (key) => params.get(key) ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const set = useCallback((patch) => {
    setParams((old) => {
      const next = new URLSearchParams(old)
      if (!('page' in patch)) next.delete('page')
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '' || (k === 'page' && Number(v) <= 1)) next.delete(k)
        else next.set(k, String(v))
      }
      return next
    }, { replace: 'q' in patch })
  }, [setParams])
  return { get, page, set }
}
