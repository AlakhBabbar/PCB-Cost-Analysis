import { Field, Switch } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import { where } from '../model'
import { ids } from './jump'
import NumberInput from './NumberInput'

function rangeMessage(s) {
  const v = s.value
  if (s.min != null && v < s.min) return `Use ${s.min} or more.`
  if (s.max != null && v > s.max) return `Use ${s.max} or less.`
  return null
}

export default function SettingField({ setting: s, dimmed }) {
  const { edit, errorAt } = usePricing()
  const id = ids.setting(s.key)
  const set = (v) => edit((d) => { d.settings.find((x) => x.key === s.key).value = v })
  const error = errorAt(where.setting(s))
  const dim = dimmed ? 'opacity-55 transition-opacity focus-within:opacity-100 hover:opacity-100' : 'transition-opacity'

  if (s.kind === 'switch') {
    return (
      <div id={id} className={`flex items-start justify-between gap-4 ${dim}`}>
        <div className="min-w-0">
          <label htmlFor={`${id}-in`} className="text-[15px] md:text-sm font-medium text-ink">{s.label}</label>
          {s.help && <p className="mt-0.5 text-xs leading-relaxed text-muted">{s.help}</p>}
          {error && <p role="alert" className="mt-1 text-xs text-[#b42318]">{error}</p>}
        </div>
        <Switch id={`${id}-in`} checked={s.value === 1} onChange={(on) => set(on ? 1 : 0)} label={s.label} />
      </div>
    )
  }
  const range = rangeMessage(s)
  return (
    <div id={id} className={dim}>
      <Field label={s.label} help={s.help} error={range ?? error} htmlFor={`${id}-in`}>
        <NumberInput id={`${id}-in`} value={s.value} min={s.min ?? undefined} max={s.max ?? undefined} onChange={set}
          suffix={s.unit || undefined} inputClassName={s.unit?.length > 4 ? 'pr-20' : ''} aria-invalid={!!(range || error)} />
      </Field>
    </div>
  )
}
