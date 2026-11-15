import { Copy } from 'lucide-react'
import { IconButton, useToast } from '../../../components/ui'

export default function CopyButton({ value, label }) {
  const toast = useToast()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast(`${label} copied`)
    } catch {
      toast('Could not copy. Select the text and copy it by hand.', { tone: 'alert' })
    }
  }
  return <IconButton icon={Copy} label={`Copy ${label.toLowerCase()}`} size="sm" onClick={copy} />
}
