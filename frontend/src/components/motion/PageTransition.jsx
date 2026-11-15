import { m } from 'framer-motion'
import { page } from './tokens'

export default function PageTransition({ className, children }) {
  return <m.div className={className} {...page}>{children}</m.div>
}
