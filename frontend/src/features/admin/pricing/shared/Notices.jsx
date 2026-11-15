import { useEffect } from 'react'
import { m } from 'framer-motion'
import { CircleAlert, Info } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { useShake } from '../../../../components/motion'

export function SetupBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-hair sm:flex-row sm:items-center">
      <Info className="h-4 w-4 shrink-0 text-muted" />
      <p className="min-w-0 flex-1 text-[15px] md:text-sm text-muted">
        Prices are running on the built in starting values. Saving needs the one time setup first.
      </p>
      <Button variant="secondary" size="sm" to="/admin/store">Open setup</Button>
    </div>
  )
}

// pulse changes on every failed save and shakes the card.
export function ErrorSummary({ errors, pulse }) {
  const [controls, shake] = useShake()
  useEffect(() => { if (pulse) shake() }, [pulse, shake])
  return (
    <m.div animate={controls} role="alert" className="rounded-xl border border-line bg-white px-4 py-3 shadow-hair">
      <p className="flex items-center gap-2 text-[15px] md:text-sm font-medium text-ink">
        <CircleAlert className="h-4 w-4 text-[#b42318]" />Fix these before saving
      </p>
      <ul className="mt-2 flex flex-col gap-1.5 pl-6 text-[14px] md:text-[13px] text-muted">
        {errors.map((e, i) => <li key={i}><span className="font-medium text-ink">{e.where}</span>: {e.msg}</li>)}
      </ul>
    </m.div>
  )
}
