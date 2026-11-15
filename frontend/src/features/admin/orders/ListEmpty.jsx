import { RotateCw, Store } from 'lucide-react'
import { Button, EmptyState } from '../../../components/ui'
import { SetupNeeded } from '../../../components/art'
import { errorText } from '../../../lib/errorText'

export function SetupState({ compact }) {
  return (
    <EmptyState
      art={SetupNeeded}
      compact={compact}
      title="Sales records are not set up yet"
      description="Finish the setup on the Store page and your orders, leads and files will show here."
      action={<Button variant="secondary" icon={Store} to="/admin/store">Open Store page</Button>}
    />
  )
}

export function ErrorState({ error, onRetry, title = 'Could not load this' }) {
  return (
    <EmptyState
      compact
      title={title}
      description={errorText(error)}
      action={<Button variant="secondary" icon={RotateCw} onClick={onRetry}>Try again</Button>}
    />
  )
}

// What a list shows when it has no rows: error, not set up, no search match, or truly empty.
export default function ListEmpty({ api, searching, filtered, art, title, description }) {
  if (api.error) return <ErrorState error={api.error} onRetry={api.reload} title="Could not load this list" />
  if (api.data?.ready === false) return <SetupState />
  if (searching) return <EmptyState compact title="Nothing matches your search" description="Try a name, phone number, email or company." />
  if (filtered) return <EmptyState compact art={art} title="Nothing here right now" description="Nothing matches this tab. The All tab shows everything." />
  return <EmptyState art={art} title={title} description={description} />
}
