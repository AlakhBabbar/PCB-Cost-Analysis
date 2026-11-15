import { useCallback, useRef } from 'react'
import { sendCheckout } from '../../api/checkout'
import { compact, isEmail, phoneDigits } from './contact'
import { sessionId } from './session'

// Saves the buyer's contact once they leave a valid email or phone. Fire and forget.
export default function useCheckoutCapture(quoteBody) {
  const last = useRef('')
  const body = useRef(quoteBody)
  body.current = quoteBody
  return useCallback((form) => {
    const email = isEmail(form.email) ? form.email.trim() : null
    const phone = phoneDigits(form.phone)
    const key = `${email}|${phone}`
    if ((!email && !phone) || key === last.current) return
    last.current = key
    const contact = compact({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email, phone, company: form.company.trim() })
    sendCheckout({ kind: 'checkout', contact, quote: body.current }, sessionId()).catch(() => {})
  }, [])
}
