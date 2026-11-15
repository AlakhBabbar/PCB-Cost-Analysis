import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfirm } from '../../../../components/ui'

const LEAVE = { title: 'Leave without saving?', message: 'Your pricing changes are not saved yet and will be lost.', confirmLabel: 'Leave', tone: 'danger' }

export default function useLeaveGuard(dirty, base) {
  const navigate = useNavigate()
  const confirm = useConfirm()

  useEffect(() => {
    if (!dirty) return
    const onUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    const onClick = (e) => {
      const a = e.target.closest?.('a[href]')
      if (!a || a.target || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname.startsWith(base)) return
      e.preventDefault()
      e.stopPropagation()
      confirm(LEAVE).then((ok) => ok && navigate(url.pathname + url.search))
    }
    window.addEventListener('beforeunload', onUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty, base, confirm, navigate])
}
