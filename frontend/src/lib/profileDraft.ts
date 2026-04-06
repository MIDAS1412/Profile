import type { ProfileResponse } from '../types'

const PROFILE_DRAFT_KEY = 'midas-profile-draft'
export const PROFILE_UPDATED_EVENT = 'midas-profile-updated'

export function getStoredProfile(): ProfileResponse | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(PROFILE_DRAFT_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as ProfileResponse
  } catch {
    return null
  }
}

export function saveStoredProfile(profile: ProfileResponse) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(profile))
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT))
}

export function clearStoredProfile() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(PROFILE_DRAFT_KEY)
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT))
}

export function hasStoredProfile() {
  return getStoredProfile() !== null
}
