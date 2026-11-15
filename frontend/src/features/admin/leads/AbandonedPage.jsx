import { EmptyAbandoned } from '../../../components/art'
import LeadList from './LeadList'

const TABS = [
  {
    value: 'abandoned', label: 'Left at checkout', art: EmptyAbandoned,
    empty: ['Nobody has left at checkout', 'A buyer shows here 10 minutes after they give an email or phone at checkout and stop, so you can call them before they forget.'],
  },
  {
    value: 'browsing', label: 'Only got a price', art: EmptyAbandoned,
    empty: ['No price checks yet', 'Visitors who priced a board but did not start checkout show here.'],
  },
]

export default function AbandonedPage() {
  return <LeadList title="Abandoned checkouts" description="Buyers who got a price or started checkout and did not finish. A checkout counts as left after 10 quiet minutes." tabs={TABS} />
}
