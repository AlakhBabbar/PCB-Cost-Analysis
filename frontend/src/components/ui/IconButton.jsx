import { Link } from 'react-router-dom'
import Spinner from './Spinner'
import { VARIANTS, cx, focusRing } from './styles'

const SIZES = { sm: 'w-10 h-10 md:w-8 md:h-8', md: 'w-11 h-11 md:w-9 md:h-9' }

export default function IconButton({ icon: Icon, label, variant = 'ghost', size = 'md', loading, to, className = '', ...props }) {
  const cls = cx('press inline-flex shrink-0 items-center justify-center rounded-lg disabled:cursor-not-allowed', VARIANTS[variant], SIZES[size], focusRing, className)
  const icon = loading ? <Spinner size={15} /> : <Icon className="w-4 h-4" />
  if (to) return <Link to={to} aria-label={label} title={label} className={cls} {...props}>{icon}</Link>
  return (
    <button type="button" aria-label={label} title={label} disabled={loading || props.disabled} className={cls} {...props}>
      {icon}
    </button>
  )
}
