import InfoTip from './InfoTip'

export default function Field({ label, help, hint, error, info, badge, htmlFor, aside, className = '', children }) {
  const note = help ?? hint
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      {(label || aside) && (
        <div className="flex items-center gap-2">
          {label && <label htmlFor={htmlFor} className="text-[14px] md:text-[13px] font-medium text-ink">{label}</label>}
          {info && <InfoTip text={info} title={typeof label === 'string' ? label : undefined} />}
          {badge}
          {aside && <span className="ml-auto">{aside}</span>}
        </div>
      )}
      {children}
      {error ? <p role="alert" className="text-xs text-[#b42318]">{error}</p> : note ? <p className="text-xs leading-relaxed text-muted">{note}</p> : null}
    </div>
  )
}
