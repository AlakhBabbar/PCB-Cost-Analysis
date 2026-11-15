import { isValidElement } from 'react'
import FadeIn from '../motion/FadeIn'

// art: an art component (e.g. EmptyOrders) or an element. action: any node, usually a Button.
export default function EmptyState({ art: Art, title, description, action, compact, className = '' }) {
  const pic = !Art || isValidElement(Art) ? Art : <Art size={compact ? 112 : 148} />
  return (
    <FadeIn className={`flex flex-col items-center px-4 text-center ${compact ? 'py-8' : 'py-12 md:py-16'} ${className}`}>
      {pic && <div className="mb-4">{pic}</div>}
      {title && <h3 className="text-[16px] md:text-[15px] font-semibold text-ink">{title}</h3>}
      {description && <p className="mt-1.5 max-w-sm text-[15px] md:text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </FadeIn>
  )
}
