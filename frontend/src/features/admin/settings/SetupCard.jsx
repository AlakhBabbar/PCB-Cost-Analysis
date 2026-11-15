import { Card, EmptyState } from '../../../components/ui'
import { SetupNeeded } from '../../../components/art'
import CopyText from './CopyText'

// Shown when the records tables do not exist yet.
export default function SetupCard({ title, file = 'supabase/migrations/003_records.sql' }) {
  return (
    <Card>
      <EmptyState art={SetupNeeded} title={title}
        description="Open the Supabase SQL editor, paste in this file from the project and run it. Then reload this page."
        action={<div className="w-full max-w-sm"><CopyText value={file} label="Copy file name" /></div>} />
    </Card>
  )
}
