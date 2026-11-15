import { request } from './client'

export const getOptions = () => request('/api/pricing/options')
export const getQuote = (body, sessionId) => request('/api/quote', { method: 'POST', body, sessionId })
