import { useEffect, useState } from 'react'
import { buildApiUrl } from '../config/api'
import { profileData } from '../data/profile'
import type { ProfileApiResponse, ProfileResponse } from '../types'

type FetchState = {
  data: ProfileResponse | null
  loading: boolean
  error: string | null
}

const profileEndpoint = buildApiUrl('/profile')

export function useProfile() {
  const [state, setState] = useState<FetchState>({
    data: null,
    loading: Boolean(profileEndpoint),
    error: null,
  })

  useEffect(() => {
    if (!profileEndpoint) {
      setState({
        data: profileData,
        loading: false,
        error: null,
      })
      return
    }

    const endpoint = profileEndpoint
    const controller = new AbortController()

    async function loadProfile() {
      try {
        const response = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Profile request failed with status ${response.status}`)
        }

        const payload = (await response.json()) as ProfileApiResponse

        setState({
          data: payload,
          loading: false,
          error: null,
        })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.warn('Falling back to bundled profile data.', error)
        setState({
          data: profileData,
          loading: false,
          error: null,
        })
      }
    }

    void loadProfile()

    return () => controller.abort()
  }, [])

  return state
}
