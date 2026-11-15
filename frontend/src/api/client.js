// Set VITE_API_URL to point somewhere else. Without it a build talks to its own origin and dev talks to the local API.
export const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d) => d.msg ?? d).join('. ') : JSON.stringify(detail))
    this.status = status
    this.detail = detail
  }
}

let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

// Drops empty values: qs({ q: '', page: 2 }) gives "?page=2".
export function qs(params = {}) {
  const pairs = Object.entries(params).filter(([, v]) => v != null && v !== '')
  return pairs.length ? `?${new URLSearchParams(pairs).toString()}` : ''
}

export async function request(path, { method = 'GET', body, token, sessionId, query } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (sessionId) headers['X-Session-Id'] = sessionId
  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE_URL}${path}${qs(query)}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.status, data?.detail ?? res.statusText)
  }
  return data
}
