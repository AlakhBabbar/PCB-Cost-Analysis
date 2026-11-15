export const spring = {
  panel: { type: 'spring', stiffness: 420, damping: 38 },
  sheet: { type: 'spring', stiffness: 420, damping: 32 },
  row: { type: 'spring', stiffness: 520, damping: 40 },
  ink: { type: 'spring', stiffness: 500, damping: 38 },
  pop: { type: 'spring', stiffness: 700, damping: 22 },
}

export const ease = [0.2, 0.8, 0.2, 1]
export const sheetEase = [0.32, 0.72, 0, 1]
export const cssEase = 'cubic-bezier(0.32, 0.72, 0, 1)'

export const staggerDelay = (i) => Math.min(i, 8) * 0.04

export const rowIn = {
  hidden: { opacity: 0, y: 10 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { ...spring.row, delay: staggerDelay(i) } }),
}

export const page = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.16, ease } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.16, ease } },
}
