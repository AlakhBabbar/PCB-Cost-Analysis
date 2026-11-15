import { Card, KeyValue } from '../../../components/ui'
import ContactLine from './ContactLine'
import { fullName } from './labels'

const address = (c) => {
  const place = [c.city, [c.state, c.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const lines = [c.address1, c.address2, place].filter(Boolean)
  return lines.length ? lines.map((l) => <span key={l} className="block">{l}</span>) : null
}

export default function CustomerCard({ customer: c }) {
  return (
    <Card title="Customer">
      <KeyValue items={[
        { label: 'Name', value: fullName(c) || null },
        c.company && { label: 'Company', value: c.company },
        c.gstin && { label: 'GSTIN', value: <span className="font-mono text-[13px]">{c.gstin}</span> },
        { label: 'Phone', value: <ContactLine value={c.phone} kind="phone" /> },
        { label: 'Email', value: <ContactLine value={c.email} kind="email" /> },
        { label: 'Address', value: address(c) },
      ]} />
    </Card>
  )
}
