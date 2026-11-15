import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { IconButton, useToast } from '../../../components/ui'

// A value the owner must paste somewhere, with a copy button.
export default function CopyText({ value, label = 'Copy' }) {
  const toast = useToast()
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setDone(true)
      toast('Copied')
      setTimeout(() => setDone(false), 1600)
    } catch {
      toast('Could not copy. Select the text and copy it yourself.', { tone: 'alert' })
    }
  }
  return (
    <div className="flex min-w-0 items-center gap-1 rounded-lg border border-line bg-canvas py-1 pl-3 pr-1">
      <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink select-all">{value}</code>
      <IconButton icon={done ? Check : Copy} label={label} size="sm" onClick={copy} />
    </div>
  )
}
