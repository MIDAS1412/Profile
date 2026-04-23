import { useEffect, useState } from 'react'
import { buildApiUrl } from '../config/api'
import type { ProfileViewsResponse } from '../types'

type ViewState = {
  count: number | null
  loading: boolean
}

const PROFILE_VIEW_SESSION_KEY = 'midas-profile-view-recorded'
const profileViewsEndpoint = buildApiUrl('/profile/views')

let cachedViewCount: number | null = null
let inflightViewsRequest: Promise<ProfileViewsResponse> | null = null

function buildViewPayload() {
  if (typeof window === 'undefined') {
    return null
  }

  return JSON.stringify({
    pagePath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    pageUrl: window.location.href,
    referrer: document.referrer || null,
  })
}

async function requestProfileViews() {
  if (!profileViewsEndpoint) {
    throw new Error('Profile view endpoint is not available.')
  }

  if (cachedViewCount !== null) {
    return {
      ok: true,
      count: cachedViewCount,
      updatedAt: new Date().toISOString(),
    } satisfies ProfileViewsResponse
  }

  if (!inflightViewsRequest) {
    const hasRecordedView =
      typeof window !== 'undefined' && window.sessionStorage.getItem(PROFILE_VIEW_SESSION_KEY) === '1'
    const method = hasRecordedView ? 'GET' : 'POST'
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    const requestInit: RequestInit = {
      method,
      headers,
    }

    if (method === 'POST') {
      headers['Content-Type'] = 'application/json'
      requestInit.body = buildViewPayload() ?? '{}'
    }

    inflightViewsRequest = fetch(profileViewsEndpoint, requestInit)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`View request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as ProfileViewsResponse

        cachedViewCount = payload.count

        if (!hasRecordedView && typeof window !== 'undefined') {
          window.sessionStorage.setItem(PROFILE_VIEW_SESSION_KEY, '1')
        }

        return payload
      })
      .finally(() => {
        inflightViewsRequest = null
      })
  }

  return inflightViewsRequest
}

export function useProfileViews() {
  const [state, setState] = useState<ViewState>({
    count: cachedViewCount,
    loading: Boolean(profileViewsEndpoint && cachedViewCount === null),
  })

  useEffect(() => {
    let cancelled = false

    if (!profileViewsEndpoint) {
      setState({
        count: null,
        loading: false,
      })
      return () => {
        cancelled = true
      }
    }

    void requestProfileViews()
      .then((payload) => {
        if (cancelled) {
          return
        }

        setState({
          count: payload.count,
          loading: false,
        })
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        console.warn('Unable to load profile view count.', error)
        setState({
          count: null,
          loading: false,
        })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
