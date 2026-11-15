import { useState } from 'react'
import { Input } from '../../../../components/ui'

const asText = (v) => (v == null || Number.isNaN(v) ? '' : String(v))

// Number box that lets people type freely and only reports real numbers.
export default function NumberInput({ value, onChange, onBlur, step = 'any', ...props }) {
  const [text, setText] = useState(asText(value))
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (Number(text) !== value) setText(asText(value))
  }
  return (
    <Input
      type="number"
      inputMode="decimal"
      step={step}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        if (e.target.value.trim() !== '' && Number.isFinite(Number(e.target.value))) onChange(Number(e.target.value))
      }}
      {...props}
      onBlur={(e) => { setText(asText(value)); onBlur?.(e) }}
    />
  )
}
