import { m } from 'framer-motion'
import { spring } from './tokens'

export default function Pop({ as = 'span', className, children }) {
  const Tag = m[as]
  return (
    <Tag className={className} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={spring.pop}>
      {children}
    </Tag>
  )
}
