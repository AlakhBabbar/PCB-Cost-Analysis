const FLASH = ['ring-2', 'ring-accent/40', 'ring-offset-2', 'rounded-lg']

// Waits for the target to render after a route change, then scrolls to it and flashes it.
export function jumpTo(id, tries = 30) {
  const el = document.getElementById(id)
  if (!el) {
    if (tries > 0) requestAnimationFrame(() => jumpTo(id, tries - 1))
    return
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add(...FLASH)
  setTimeout(() => el.classList.remove(...FLASH), 1600)
  el.querySelector('input, select, textarea, button')?.focus({ preventScroll: true })
}

export const ids = {
  setting: (k) => `set-${k}`,
  category: (k) => `cat-${k}`,
  option: (k, i) => `opt-${k}-${i}`,
  line: (k) => `line-${k}`,
  rule: (id) => `rule-${id}`,
}
