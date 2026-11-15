import { m } from 'framer-motion'
import { rowIn } from './tokens'

export function Stagger({ as = 'div', className, children }) {
  const Tag = m[as]
  return <Tag className={className} initial="hidden" animate="show">{children}</Tag>
}

export function StaggerItem({ i = 0, as = 'div', className, children, ...props }) {
  const Tag = m[as]
  return <Tag className={className} variants={rowIn} custom={i} {...props}>{children}</Tag>
}
