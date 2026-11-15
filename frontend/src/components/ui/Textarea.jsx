import { fieldBase } from './styles'

export default function Textarea({ rows = 3, mono, className = '', ...props }) {
  return <textarea rows={rows} className={`${fieldBase} min-h-20 py-2 leading-relaxed resize-y ${mono ? 'font-mono text-[13px]' : ''} ${className}`} {...props} />
}
