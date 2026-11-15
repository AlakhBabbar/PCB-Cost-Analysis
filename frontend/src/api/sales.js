import { request } from './client'

const A = '/api/admin'
const id = (v) => encodeURIComponent(v)

export const getSummary = (token, days = 14) => request(`${A}/summary`, { token, query: { days } })
export const getStore = (token) => request(`${A}/store`, { token })

export const listOrders = (token, query) => request(`${A}/orders`, { token, query })
export const getOrder = (token, orderId) => request(`${A}/orders/${id(orderId)}`, { token })
export const patchOrder = (token, orderId, body) => request(`${A}/orders/${id(orderId)}`, { method: 'PATCH', body, token })
export const syncOrder = (token, orderId) => request(`${A}/orders/${id(orderId)}/sync`, { method: 'POST', token })

export const listSessions = (token, query) => request(`${A}/sessions`, { token, query })
export const patchSession = (token, sessionId, body) => request(`${A}/sessions/${id(sessionId)}`, { method: 'PATCH', body, token })

export const listCustomers = (token, query) => request(`${A}/customers`, { token, query })
export const listFiles = (token, query) => request(`${A}/files`, { token, query })
export const fileLink = (token, uploadId) => request(`${A}/files/${id(uploadId)}/link`, { token })
