import useMediaQuery from '../../lib/useMediaQuery'

export default function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
