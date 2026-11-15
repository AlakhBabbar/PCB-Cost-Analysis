import { request } from './client'

export function parseGerber(file, sessionId) {
  const body = new FormData()
  body.append('file', file)
  return request('/api/gerber/parse', { method: 'POST', body, sessionId })
}
