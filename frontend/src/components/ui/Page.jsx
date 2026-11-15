// Page body. width "full" for lists, "narrow" (1000px) for detail and settings pages.
export function Page({ width = 'full', className = '', children }) {
  return <div className={`mx-auto flex w-full min-w-0 flex-col gap-4 md:gap-5 ${width === 'narrow' ? 'max-w-[1000px]' : 'max-w-[1240px]'} ${className}`}>{children}</div>
}

// Two thirds main, one third side. Stacks on phones.
export function Columns({ main, side, className = '' }) {
  return (
    <div className={`grid min-w-0 grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3 ${className}`}>
      <div className="flex min-w-0 flex-col gap-4 md:gap-5 lg:col-span-2">{main}</div>
      <div className="flex min-w-0 flex-col gap-4 md:gap-5">{side}</div>
    </div>
  )
}
