import { ApiError, request } from './client'

// direct: the zip goes straight to storage with a one time link, so large files do not pass through the API.
export async function parseGerber(file, sessionId, direct) {
  if (!direct) {
    const body = new FormData()
    body.append('file', file)
    return request('/api/gerber/parse', { method: 'POST', body, sessionId })
  }
  const { uploadId, url } = await request('/api/gerber/upload-url', {
    method: 'POST', body: { filename: file.name, size: file.size }, sessionId,
  })
  const sent = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/zip' }, body: file })
  if (!sent.ok) throw new ApiError(sent.status, 'We could not upload your file. Please try again.')
  return request('/api/gerber/parse-upload', { method: 'POST', body: { uploadId, filename: file.name }, sessionId })
}
