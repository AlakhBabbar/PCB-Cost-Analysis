import { useCallback, useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import { ConfirmContext } from './feedback'

export default function ConfirmProvider({ children }) {
  const [ask, setAsk] = useState({ open: false })
  const resolver = useRef(null)

  const confirm = useCallback((opts) => new Promise((resolve) => {
    resolver.current = resolve
    setAsk({ ...opts, open: true })
  }), [])
  const answer = (ok) => { resolver.current?.(ok); resolver.current = null; setAsk((a) => ({ ...a, open: false })) }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog {...ask} onConfirm={() => answer(true)} onCancel={() => answer(false)} />
    </ConfirmContext.Provider>
  )
}
