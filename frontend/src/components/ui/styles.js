export const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white'

export const fieldBase =
  'w-full px-3 rounded-lg border border-line bg-white text-[16px] md:text-sm text-ink placeholder:text-faint shadow-hair outline-none transition-colors hover:border-line-strong focus:border-ink/40 focus:ring-2 focus:ring-accent/15 disabled:bg-canvas disabled:text-faint aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-100'

export const inputClass = `${fieldBase} h-11 md:h-9`

export const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-[#333] disabled:bg-[#c9c9c5] disabled:text-white',
  secondary: 'bg-white text-ink border border-line shadow-hair hover:bg-[#fafaf9] hover:border-line-strong disabled:text-faint',
  ghost: 'text-muted hover:bg-sunken hover:text-ink disabled:text-faint',
  danger: 'bg-[#c4321f] text-white hover:bg-[#a92a1a] disabled:bg-[#e6aaa1]',
}

export const linkClass = 'font-medium text-accent underline-offset-2 hover:underline'

export const cx = (...parts) => parts.filter(Boolean).join(' ')
