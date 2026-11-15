import { m } from 'framer-motion'
import { ease } from './tokens'

export default function FadeIn({ delay = 0, y = 6, as = 'div', className, children }) {
  const Tag = m[as]
  return (
    <Tag className={className} initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease, delay }}>
      {children}
    </Tag>
  )
}
