function normalizeBaseUrl(value?: string) {
  const nextValue = value?.trim()

  if (!nextValue) {
    return null
  }

  return nextValue.replace(/\/+$/, '')
}

const environmentBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
const developmentBaseUrl = import.meta.env.DEV ? '/api' : null

export const apiBaseUrl = environmentBaseUrl ?? developmentBaseUrl

export function buildApiUrl(path: string) {
  if (!apiBaseUrl) {
    return null
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${apiBaseUrl}${normalizedPath}`
}
