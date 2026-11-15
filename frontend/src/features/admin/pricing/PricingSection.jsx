import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { History, RotateCcw } from 'lucide-react'
import { Badge, Button, EmptyState, Page, PageHeader, SaveBar, Skeleton, Tabs, useConfirm, useToast } from '../../../components/ui'
import { SetupNeeded } from '../../../components/art'
import { getDefaults } from '../../../api/pricingAdmin'
import { useAdmin } from '../shell/AdminContext'
import { PricingContext } from './PricingContext'
import useDraft from './useDraft'
import useLeaveGuard from './shared/useLeaveGuard'
import SectionSearch from './shared/SectionSearch'
import HistoryDialog from './shared/HistoryDialog'
import SaveDialog from './shared/SaveDialog'
import { ErrorSummary, SetupBanner } from './shared/Notices'
import { STARTER_BOARD } from './model'

const OptionsPage = lazy(() => import('./options/OptionsPage'))
const RulesPage = lazy(() => import('./rules/RulesPage'))
const CostsPage = lazy(() => import('./costs/CostsPage'))
const FormulasPage = lazy(() => import('./formulas/FormulasPage'))
const TesterPage = lazy(() => import('./tester/TesterPage'))

const BASE = '/admin/pricing'
const TABS = [
  { value: 'options', label: 'Buyer options', text: 'What buyers can pick and what each choice does to the price.' },
  { value: 'rules', label: 'Price rules', text: 'Markup, safety nets, fees and tax.' },
  { value: 'costs', label: 'Factory costs', text: 'What it costs you to make and ship a board.' },
  { value: 'formulas', label: 'Formulas', text: 'How every number turns into a price.' },
  { value: 'tester', label: 'Price tester', text: 'Price any board and see where every rupee comes from.' },
]

function Loading() {
  return (
    <Page width="narrow">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-10 w-full" />
      {[0, 1].map((i) => <Skeleton key={i} className="h-56 w-full" rounded="rounded-xl" />)}
    </Page>
  )
}

function blockedReason(p) {
  if (!p.ready) return 'Saving needs the one time setup'
  if (p.check.ok) return null
  const first = p.check.errors[0]
  if (!first) return 'Fix the marked fields to save'
  const name = first.where.split(' > ').at(-1)
  return first.where.startsWith('Formulas > ') ? `Fix the formula "${name}" to save` : `Fix "${name}" to save`
}

export default function PricingSection() {
  const { token } = useAdmin()
  const p = useDraft(token)
  const [board, setBoard] = useState(STARTER_BOARD)
  const [panel, setPanel] = useState(null)
  const [tried, setTried] = useState(false)
  const [pulse, setPulse] = useState(0)
  const confirm = useConfirm()
  const toast = useToast()
  const navigate = useNavigate()
  const live = useLocation()
  // While this section animates out the URL already belongs to another page, so keep routing on the last pricing URL.
  const [location, setLocation] = useState(live)
  if (live !== location && live.pathname.startsWith(BASE)) setLocation(live)
  const { pathname } = location
  const tab = TABS.find((t) => pathname.startsWith(`${BASE}/${t.value}`)) ?? TABS[0]
  useLeaveGuard(p.dirty, BASE)

  const value = { ...p, token, board, setBoard }

  if (p.loading && !p.draft) return <Loading />
  if (!p.draft) {
    return (
      <Page width="narrow">
        <EmptyState art={SetupNeeded} title="Could not load pricing" description={p.error?.message ?? 'Please try again.'}
          action={<Button variant="secondary" onClick={p.reload}>Retry</Button>} />
      </Page>
    )
  }

  const blocked = blockedReason(p)
  const startSave = () => {
    if (blocked) {
      setTried(true)
      setPulse((n) => n + 1)
      toast(blocked, { tone: 'alert' })
      return
    }
    setPanel('save')
  }
  const save = async (note) => {
    const r = await p.save(note)
    if (r.ok) { setPanel(null); setTried(false); toast('Pricing saved'); return true }
    setPanel(null)
    setTried(true)
    setPulse((n) => n + 1)
    toast(r.list ? 'Some values need fixing' : r.error.status === 503 ? 'Saving needs the one time setup' : r.error.message || 'Could not save', { tone: 'alert' })
    return false
  }
  const reset = async () => {
    const ok = await confirm({ title: 'Reset to starting values?', message: 'Every number, option and formula goes back to the built in values. Nothing changes until you save.', confirmLabel: 'Reset' })
    if (!ok) return
    try {
      p.setDraft((await getDefaults(token)).config)
      toast('Starting values loaded. Save to keep them.')
    } catch (e) {
      toast(e.message || 'Could not load the starting values', { tone: 'alert' })
    }
  }
  const matched = p.check.errors.length - p.summary.length
  const shown = tried || p.summary.length ? [...p.summary, ...(matched > 0 ? [{ where: 'Marked fields', msg: `${matched} more ${matched === 1 ? 'value needs' : 'values need'} fixing, shown beside ${matched === 1 ? 'it' : 'them'}.` }] : [])] : []

  return (
    <PricingContext.Provider value={value}>
      <Page width="narrow" className="pb-24">
        <PageHeader
          title={tab.label}
          description={tab.text}
          badges={tab.value === 'formulas' && <Badge tone="wait">Advanced</Badge>}
          actions={<>
            <Button variant="secondary" size="sm" icon={History} onClick={() => setPanel('history')}>History</Button>
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>Reset</Button>
          </>}
        >
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Tabs items={TABS.map((t) => ({ ...t, to: `${BASE}/${t.value}` }))} value={tab.value} className="min-w-0 flex-1" />
            <SectionSearch />
          </div>
        </PageHeader>
        {!p.ready && <SetupBanner />}
        {shown.length > 0 && <ErrorSummary errors={shown} pulse={pulse} />}
        <Suspense fallback={<Skeleton className="h-64 w-full" rounded="rounded-xl" />}>
          <Routes location={location}>
            <Route index element={<Navigate to={`${BASE}/options`} replace />} />
            <Route path="options" element={<OptionsPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="costs" element={<CostsPage />} />
            <Route path="formulas" element={<FormulasPage />} />
            <Route path="tester" element={<TesterPage />} />
            <Route path="*" element={<Navigate to={`${BASE}/options`} replace />} />
          </Routes>
        </Suspense>
      </Page>
      <SaveBar
        dirty={p.dirty}
        busy={p.saving}
        message={blocked ?? (p.check.pending ? 'Checking your changes' : 'Unsaved pricing changes')}
        onDiscard={() => { p.discard(); setTried(false) }}
        onSave={startSave}
        extra={{ label: 'Try it', onClick: () => navigate(`${BASE}/tester?draft=1`) }}
      />
      <SaveDialog open={panel === 'save'} onClose={() => setPanel(null)} onSave={save} busy={p.saving} />
      <HistoryDialog open={panel === 'history'} onClose={() => setPanel(null)} token={token} />
    </PricingContext.Provider>
  )
}
