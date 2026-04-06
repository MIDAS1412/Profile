import { useEffect, useState } from 'react'
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
      try {
        const response = await fetch('/api/profile')

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }

        const payload = (await response.json()) as ProfileResponse

        if (active) {
          setState({
            data: payload,
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

    return () => {
      active = false
    }
  }, [])

  return state
}
