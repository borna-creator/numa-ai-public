import { sanitizeUserFacingError } from '../../shared/userFacingErrors.js'

const apiBase = import.meta.env.VITE_API_DOMAIN ?? ''

export function userFacingError(err, context = 'default') {
  if (err instanceof Error) {
    return sanitizeUserFacingError(err.message, context)
  }
  return sanitizeUserFacingError(String(err ?? ''), context)
}

export async function api(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(
      sanitizeUserFacingError(data.error || `Request failed (${res.status})`, 'request'),
    )
  }

  return data
}

export async function uploadFile(path, formData) {
  return api(path, { method: 'POST', body: formData })
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString()
}

export function getApiBase() {
  return apiBase
}
