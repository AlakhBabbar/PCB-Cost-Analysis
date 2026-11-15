import { request } from './client'

const base = '/api/admin/pricing'

export const getPricing = (token) => request(base, { token })
export const savePricing = (token, config, note) => request(base, { method: 'PUT', body: { config, note }, token })
export const getDefaults = (token) => request(`${base}/defaults`, { token })
export const checkPricing = (token, config) => request(`${base}/check`, { method: 'POST', body: { config }, token })
export const getVersions = (token) => request(`${base}/versions`, { token })
export const restoreVersion = (token, id) => request(`${base}/versions/${encodeURIComponent(id)}/restore`, { method: 'POST', token })
export const priceBoard = (token, board, config) =>
  request('/api/admin/quote', { method: 'POST', body: config ? { ...board, config } : board, token })
