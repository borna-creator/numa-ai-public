const apiBase = import.meta.env.VITE_API_DOMAIN ?? ''

export async function api(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

export function getApiBase() {
  return apiBase
}
