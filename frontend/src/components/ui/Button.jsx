import { Link } from 'react-router-dom'
import Spinner from './Spinner'
import { VARIANTS, cx, focusRing } from './styles'

const SIZES = {
  sm: 'h-10 md:h-8 px-3 text-[14px] md:text-[13px] gap-1.5',
  md: 'h-11 md:h-9 px-4 text-[15px] md:text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
}

export default function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, to, href, className = '', children, ...props }) {
  const cls = cx('press inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap select-none disabled:cursor-not-allowed', VARIANTS[variant], SIZES[size], focusRing, className)
  const inner = (
    <>
      {loading ? <Spinner size={15} className={variant === 'primary' || variant === 'danger' ? 'text-white/80' : ''} /> : Icon ? <Icon className="w-4 h-4 shrink-0" /> : null}
      {children}
      {IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </>
  )
  if (to) return <Link to={to} className={cls} {...props}>{inner}</Link>
  if (href) return <a href={href} className={cls} {...props}>{inner}</a>
  return <button type="button" disabled={loading || props.disabled} aria-busy={loading || undefined} className={cls} {...props}>{inner}</button>
}
