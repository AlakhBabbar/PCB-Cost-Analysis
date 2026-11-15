import { request } from './client'

// { uploadId, quote, customer } gives { orderId, paymentUrl }.
export const placeOrder = (body, sessionId) => request('/api/order', { method: 'POST', body, sessionId })
