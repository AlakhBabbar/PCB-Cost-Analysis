import { useCallback, useEffect, useState } from 'react'
import { me, signin } from '../../../api/auth'
import { setUnauthorizedHandler } from '../../../api/client'

const KEY = 'pcb_admin_token'

export default function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(KEY)))

  const signOut = useCallback(() => {
    localStorage.removeItem(KEY)
    setToken(null)
    setUser(null)
  }, [])

  const signIn = useCallback(async (email, password) => {
    const r = await signin({ email, password }).catch((e) => {
      if (e.status === 403 && e.detail === 'pending') e.code = 'pending'
      throw e
    })
    localStorage.setItem(KEY, r.token)
    setToken(r.token)
    setUser({ ...r.user, role: r.user?.role ?? r.role })
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  useEffect(() => {
    const t = localStorage.getItem(KEY)
    if (!t) return
    me(t).then(setUser, (e) => e.status === 401 && signOut()).finally(() => setLoading(false))
  }, [signOut])

  return { user, token, loading, signIn, signOut, role: user?.role ?? 'owner' }
}
