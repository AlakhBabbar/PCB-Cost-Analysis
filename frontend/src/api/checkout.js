import { request } from './client'

// { kind: 'checkout' | 'manual', contact, note?, quote? }, answers 204.
export const sendCheckout = (body, sessionId) => request('/api/checkout', { method: 'POST', body, sessionId })
