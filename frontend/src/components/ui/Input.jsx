import { inputClass } from './styles'

const affix = 'absolute top-1/2 -translate-y-1/2 text-[13px] md:text-xs text-faint pointer-events-none'

export default function Input({ prefix, suffix, className = '', inputClassName = '', ...props }) {
  if (!suffix && !prefix) return <input className={`${inputClass} ${className}`} {...props} />
  return (
    <div className={`relative ${className}`}>
      {prefix && <span className={`${affix} left-3`}>{prefix}</span>}
      <input className={`${inputClass} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-14' : ''} ${inputClassName}`} {...props} />
      {suffix && <span className={`${affix} right-3`}>{suffix}</span>}
    </div>
  )
}
