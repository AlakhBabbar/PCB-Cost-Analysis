import { request } from './client'

export const getActivity = (token, page, size) => request('/api/admin/activity', { token, query: { page, size } })
export const getStore = (token) => request('/api/admin/store', { token })
