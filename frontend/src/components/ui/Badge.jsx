const TONES = {
  neutral: ['bg-[#ececea] text-[#4d4d4a]', 'bg-[#8f8f8a]'],
  good: ['bg-[#dff0e7] text-[#0b5a40]', 'bg-[#1a8a5c]'],
  wait: ['bg-[#fbefd6] text-[#7a4e00]', 'bg-[#d39417]'],
  alert: ['bg-[#fbe3df] text-[#9b2215]', 'bg-[#d43c2b]'],
  info: ['bg-[#e2ebf8] text-[#1d4a8f]', 'bg-[#3b6fc4]'],
}
const ALIAS = { success: 'good', warning: 'wait', danger: 'alert' }

export default function Badge({ tone = 'neutral', icon: Icon, dot = true, className = '', children }) {
  const [cls, dotCls] = TONES[ALIAS[tone] ?? tone] ?? TONES.neutral
  return (
    <span className={`inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium leading-none whitespace-nowrap ${cls} ${className}`}>
      {Icon ? <Icon className="w-3 h-3" /> : dot && <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} aria-hidden="true" />}
      {children}
    </span>
  )
}
