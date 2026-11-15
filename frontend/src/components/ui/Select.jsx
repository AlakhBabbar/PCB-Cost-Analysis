import { ChevronDown } from 'lucide-react'
import { inputClass } from './styles'

// options: strings or { value, label }
export default function Select({ options = [], placeholder, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select className={`${inputClass} appearance-none pr-9`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const value = typeof o === 'object' ? o.value : o
          const label = typeof o === 'object' ? o.label : o
          return <option key={value} value={value}>{label}</option>
        })}
      </select>
      <ChevronDown className="w-4 h-4 text-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}
