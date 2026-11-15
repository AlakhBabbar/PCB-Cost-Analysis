import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

// back: { to, label }. actions: buttons, the first primary one is the page's main action.
export default function PageHeader({ title, description, back, actions, badges, children, className = '' }) {
  return (
    <header className={`flex flex-col gap-3 ${className}`}>
      {back && (
        <Link to={back.to} className="-ml-1 inline-flex h-8 items-center gap-0.5 self-start rounded-md pr-2 text-[14px] md:text-[13px] font-medium text-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />{back.label ?? 'Back'}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] md:text-xl font-semibold tracking-tight text-ink">{title}</h1>
            {badges}
          </div>
          {description && <p className="mt-1 max-w-[65ch] text-[15px] md:text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
