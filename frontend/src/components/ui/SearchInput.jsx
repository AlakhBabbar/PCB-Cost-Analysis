import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { inputClass } from './styles'

// onChange fires with the debounced text.
export default function SearchInput({ value = '', onChange, placeholder = 'Search', delay = 300, className = '' }) {
  const [text, setText] = useState(value)
  const sent = useRef(value)
  const cb = useRef(onChange)
  useEffect(() => { cb.current = onChange })

  useEffect(() => {
    if (value !== sent.current) { sent.current = value; setText(value) }
  }, [value])

  useEffect(() => {
    if (text === sent.current) return
    const t = setTimeout(() => { sent.current = text; cb.current(text) }, delay)
    return () => clearTimeout(t)
  }, [text, delay])

  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${inputClass} pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
      />
      {text && (
        <button type="button" aria-label="Clear search" onClick={() => setText('')}
          className="absolute right-1 top-1/2 inline-flex h-9 w-9 md:h-7 md:w-7 -translate-y-1/2 items-center justify-center rounded-md text-faint hover:bg-sunken hover:text-ink">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
