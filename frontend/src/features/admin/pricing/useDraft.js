import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../../../api/client'
import { checkPricing, getPricing, savePricing } from '../../../api/pricingAdmin'
import { knownWheres, nameBook } from './model'

const listOf = (e) => (e instanceof ApiError && Array.isArray(e.detail) ? e.detail : null)

export default function useDraft(token) {
  const [state, setState] = useState({ loading: true, error: null, saved: null, ready: true, updatedAt: null })
  const [draft, setDraft] = useState(null)
  const [check, setCheck] = useState({ ok: true, errors: [], pending: false })
  const [saving, setSaving] = useState(false)
  const seq = useRef(0)

  const apply = useCallback((res) => {
    setState({ loading: false, error: null, saved: res.config, ready: res.ready, updatedAt: res.updatedAt })
    setDraft(res.config)
    setCheck({ ok: true, errors: [], pending: false })
  }, [])

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    getPricing(token).then(apply, (error) => setState((s) => ({ ...s, loading: false, error })))
  }, [token, apply])

  useEffect(load, [load])

  const dirty = useMemo(() => !!draft && JSON.stringify(draft) !== JSON.stringify(state.saved), [draft, state.saved])

  useEffect(() => {
    if (!dirty) return
    const id = ++seq.current
    setCheck((c) => ({ ...c, pending: true }))
    const t = setTimeout(() => {
      checkPricing(token, draft).then(
        (r) => id === seq.current && setCheck({ ok: r.ok, errors: r.errors, pending: false }),
        (e) => id === seq.current && setCheck({ ok: !listOf(e), errors: listOf(e) ?? [], pending: false }),
      )
    }, 500)
    return () => clearTimeout(t)
  }, [draft, dirty, token])

  const edit = useCallback((recipe) => setDraft((d) => {
    const next = structuredClone(d)
    recipe(next)
    return next
  }), [])

  const discard = useCallback(() => {
    setDraft(state.saved)
    setCheck({ ok: true, errors: [], pending: false })
  }, [state.saved])

  const save = useCallback(async (note) => {
    setSaving(true)
    try {
      apply(await savePricing(token, draft, note))
      return { ok: true }
    } catch (e) {
      const list = listOf(e)
      if (list) setCheck({ ok: false, errors: list, pending: false })
      return { ok: false, error: e, list }
    } finally {
      setSaving(false)
    }
  }, [token, draft, apply])

  const errors = useMemo(() => (dirty ? check.errors : []), [dirty, check.errors])
  const known = useMemo(() => (draft ? knownWheres(draft) : new Set()), [draft])
  const names = useMemo(() => (draft ? nameBook(draft) : {}), [draft])
  const errorAt = useCallback((w) => errors.filter((e) => e.where === w).map((e) => e.msg).join(' ') || null, [errors])
  const summary = useMemo(() => errors.filter((e) => !known.has(e.where)), [errors, known])

  return {
    ...state, reload: load, apply, draft, setDraft, edit, dirty, discard, save, saving,
    check: { ok: !dirty || check.ok, pending: dirty && check.pending, errors }, errorAt, summary, names,
  }
}
