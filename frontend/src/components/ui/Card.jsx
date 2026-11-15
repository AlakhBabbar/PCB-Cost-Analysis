import { cx } from './styles'

export default function Card({ title, description, actions, action, footer, padding = true, as: Tag = 'section', className = '', children }) {
  const right = actions ?? action
  const head = title || description || right
  return (
    <Tag className={cx('bg-white rounded-xl border border-line shadow-hair min-w-0', className)}>
      {head && (
        <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 md:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] md:text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] md:text-xs text-muted">{description}</p>}
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </header>
      )}
      {padding ? <div className={cx('px-4 pb-4 md:px-5', !head && 'pt-4')}>{children}</div> : children}
      {footer && <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-3 md:px-5">{footer}</footer>}
    </Tag>
  )
}
