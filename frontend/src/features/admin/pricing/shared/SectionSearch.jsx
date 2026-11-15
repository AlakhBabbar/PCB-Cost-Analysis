import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchInput } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import { PAGE_ROUTE } from '../model'
import { ids, jumpTo } from './jump'

function index(cfg) {
  return [
    ...cfg.settings.map((s) => ({ id: ids.setting(s.key), label: s.label, meta: s.section, route: PAGE_ROUTE[s.page] })),
    ...cfg.categories.map((c) => ({ id: ids.category(c.key), label: c.label, meta: 'Buyer option', route: 'options' })),
    ...cfg.categories.flatMap((c) => c.options.map((o, i) => ({ id: ids.option(c.key, i), label: o.label || o.name, meta: c.label, route: 'options' }))),
    ...cfg.rules.map((r) => ({ id: ids.rule(r.id), label: r.message, meta: 'Build rule', route: 'options' })),
    ...cfg.formulas.map((f) => ({ id: ids.line(f.key), label: f.label || f.key, meta: 'Formula', route: 'formulas' })),
  ]
}

export default function SectionSearch() {
  const { draft } = usePricing()
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const all = useMemo(() => index(draft), [draft])
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? all.filter((h) => h.label.toLowerCase().includes(t) || h.meta.toLowerCase().includes(t)).slice(0, 8) : []
  }, [all, q])

  const go = (h) => {
    setQ('')
    navigate(`/admin/pricing/${h.route}`)
    jumpTo(h.id)
  }

  return (
    <div className="relative w-full sm:w-72">
      <SearchInput value={q} onChange={setQ} delay={120} placeholder="Find a setting or option" />
      {q.trim() && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-line bg-white shadow-float">
          {hits.length ? hits.map((h) => (
            <button key={h.id} type="button" onClick={() => go(h)}
              className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left hover:bg-sunken focus:bg-sunken focus:outline-none">
              <span className="min-w-0 truncate text-[15px] md:text-sm text-ink">{h.label}</span>
              <span className="shrink-0 text-[13px] md:text-xs text-muted">{h.meta}</span>
            </button>
          )) : <p className="px-3 py-3 text-[15px] md:text-sm text-muted">Nothing matches "{q.trim()}".</p>}
        </div>
      )}
    </div>
  )
}
