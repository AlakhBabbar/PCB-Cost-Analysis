import { Field } from '../../../../components/ui'
import { usePricing } from '../PricingContext'
import NumberInput from './NumberInput'

const FIELDS = [['boardW', 'Width', 'mm'], ['boardL', 'Length', 'mm'], ['quantity', 'Quantity', 'pcs']]

export default function BoardSize({ className = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1' }) {
  const { board, setBoard } = usePricing()
  return (
    <div className={className}>
      {FIELDS.map(([k, label, unit]) => (
        <Field key={k} label={label} htmlFor={`board-${k}`}>
          <NumberInput id={`board-${k}`} value={board[k]} min={k === 'quantity' ? 1 : 0.1} suffix={unit}
            onChange={(v) => v > 0 && setBoard((b) => ({ ...b, [k]: k === 'quantity' ? Math.max(1, Math.round(v)) : v }))} />
        </Field>
      ))}
    </div>
  )
}
