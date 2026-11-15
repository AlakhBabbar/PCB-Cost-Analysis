import { request } from './client'

const user = (id) => `/api/admin/users/${encodeURIComponent(id)}`

export const getUsers = (token) => request('/api/admin/users', { token })
export const approveUser = (token, id, role) => request(`${user(id)}/approve`, { method: 'POST', body: { role }, token })
export const setRole = (token, id, role) => request(user(id), { method: 'PATCH', body: { role }, token })
export const removeUser = (token, id) => request(user(id), { method: 'DELETE', token })
