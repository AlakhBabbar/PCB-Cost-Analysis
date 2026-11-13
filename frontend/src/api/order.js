import { request } from './client'

// Creates a pending order in the shop and returns { orderId, paymentUrl }.
export function placeOrder({ quote, customer, file }) {
  const body = new FormData()
  body.append('quote', JSON.stringify(quote))
  body.append('customer', JSON.stringify(customer))
  body.append('file', file)
  return request('/api/order', { method: 'POST', body })
}
