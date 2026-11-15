import { EmptyRequests } from '../../../components/art'
import LeadList from './LeadList'

const TABS = [{
  value: 'manual', label: 'Quote requests', art: EmptyRequests,
  empty: ['No quote requests yet', 'When a board is too big, too unusual or needs a custom price, the buyer request shows here.'],
}]

export default function RequestsPage() {
  return <LeadList title="Quote requests" description="Boards the price engine could not price online. The buyer is waiting for your price." tabs={TABS} />
}
