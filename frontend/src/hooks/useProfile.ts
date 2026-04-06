import { useEffect, useState } from 'react'
import { PROFILE_UPDATED_EVENT } from '../lib/profileDraft'
import type { ProfileResponse } from '../types'

type FetchState = {
  data: ProfileResponse | null
  loading: boolean
  error: string | null
}

export function useProfile() {
  const [state, setState] = useState<FetchState>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))

      try {
        const response = await fetch('/api/profile')

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const payload = await response.json()
        const { _meta: _discard, ...profile } = payload as ProfileResponse & {
          _meta?: unknown
        }

        if (active) {
          setState({
            data: profile,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    loadProfile()

    const syncStoredProfile = () => {
      loadProfile()
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, syncStoredProfile)
    window.addEventListener('storage', syncStoredProfile)

    return () => {
      active = false
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncStoredProfile)
      window.removeEventListener('storage', syncStoredProfile)
    }
  }, [])

  return state
}
