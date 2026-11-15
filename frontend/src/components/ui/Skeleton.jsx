export default function Skeleton({ className = 'h-4 w-full', rounded = 'rounded-md' }) {
  return <span aria-hidden="true" className={`skeleton block ${rounded} ${className}`} />
}
