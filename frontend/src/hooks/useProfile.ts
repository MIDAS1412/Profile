import { useEffect, useState } from 'react'
import { PROFILE_UPDATED_EVENT, getStoredProfile } from '../lib/profileDraft'
import type { ProfileResponse } from '../types'

type FetchState = {
  baseData: ProfileResponse | null
  data: ProfileResponse | null
  loading: boolean
  error: string | null
  hasLocalOverride: boolean
}

export function useProfile() {
  const [state, setState] = useState<FetchState>({
    baseData: null,
    data: null,
    loading: true,
    error: null,
    hasLocalOverride: false,
  })

  useEffect(() => {
    let active = true

    const applyStoredData = (baseData: ProfileResponse) => {
      const storedProfile = getStoredProfile()

      return {
        baseData,
        data: storedProfile ?? baseData,
        loading: false,
        error: null,
        hasLocalOverride: storedProfile !== null,
      }
    }

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile')

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const payload = (await response.json()) as ProfileResponse

        if (active) {
          setState(applyStoredData(payload))
        }
      } catch (error) {
        if (active) {
          setState({
            baseData: null,
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            hasLocalOverride: false,
          })
        }
      }
    }

    loadProfile()

    const syncStoredProfile = () => {
      setState((current) => {
        if (!current.baseData) {
          return current
        }

        return applyStoredData(current.baseData)
      })
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
