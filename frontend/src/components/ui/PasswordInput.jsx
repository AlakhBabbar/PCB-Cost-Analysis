import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass } from './styles'

// Password box with an eye button to show or hide what was typed.
export default function PasswordInput({ className = '', ...props }) {
  const [shown, setShown] = useState(false)
  const Icon = shown ? EyeOff : Eye
  return (
    <div className={`relative ${className}`}>
      <input {...props} type={shown ? 'text' : 'password'} className={`${inputClass} pr-11`} />
      <span className="absolute inset-y-0 right-1 flex items-center">
        <button type="button" onClick={() => setShown((s) => !s)} aria-pressed={shown}
          aria-label={shown ? 'Hide password' : 'Show password'} title={shown ? 'Hide password' : 'Show password'}
          className="press grid h-9 w-9 place-items-center rounded-md text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent">
          <Icon className="h-4 w-4" />
        </button>
      </span>
    </div>
  )
}
