import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { ProfileExperience } from '../components/ProfileExperience'
import { Shell } from '../components/Shell'
import { buildApiUrl } from '../config/api'
import type {
  ExperienceItem,
  FocusArea,
  GalleryImage,
  ProfileAnalyticsBucket,
  ProfileAnalyticsResponse,
  ProfileApiResponse,
  ProfileMetric,
  ProfileResponse,
  ProfileVisitEntry,
  ProjectItem,
  SavedLocation,
  SkillItem,
  SocialItem,
} from '../types'

export const ADMIN_ROUTE = '/admin-midas-1420'

const ADMIN_TOKEN_STORAGE_KEY = 'midas-profile-admin-token'

type StatusMessage = {
  tone: 'success' | 'error'
  message: string
}

type BusyState = 'idle' | 'login' | 'logout' | 'reset' | 'save' | 'refresh-analytics'

type AdminSessionResponse = {
  ok: true
  email: string
  expiresAt: string
}

type AdminLoginResponse = AdminSessionResponse & {
  token: string
}

type EditorSectionId =
  | 'editor-identity'
  | 'editor-location'
  | 'editor-highlights'
  | 'editor-skills'
  | 'editor-projects'
  | 'editor-footer'
  | 'editor-json'

type StringListSectionKey = 'coverHeadline' | 'quickFacts' | 'principles' | 'now'

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: string) => void
  className?: string
  min?: number
  max?: number
  step?: number
}

type EditorSectionProps = {
  id: string
  kicker: string
  title: string
  description: string
  children: ReactNode
}

type ItemActionsProps = {
  index: number
  length: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

type StringListEditorProps = {
  items: string[]
  addLabel: string
  emptyLabel: string
  itemLabel: string
  onAdd: () => void
  onChangeItem: (index: number, value: string) => void
  onMoveItem: (index: number, direction: -1 | 1) => void
  onRemoveItem: (index: number) => void
}

function readStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
}

function persistToken(token: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!token) {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
}

function stripProfileMeta(payload: ProfileResponse & { _meta?: unknown }) {
  const { _meta: _discard, ...profile } = payload

  return profile as ProfileResponse
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'No data yet'
  }

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatBucketLabel(bucket: ProfileAnalyticsBucket) {
  return `${bucket.label} - ${formatNumber(bucket.count)}`
}

function formatVisitLocation(visit: ProfileVisitEntry) {
  const locationParts = [visit.location.city, visit.location.region, visit.location.country].filter(Boolean)

  return locationParts.length > 0 ? locationParts.join(', ') : 'Unknown'
}

function formatVisitDevice(visit: ProfileVisitEntry) {
  return [visit.deviceLabel, visit.browser, visit.os].filter(Boolean).join(' / ')
}

function formatReferrerHost(referrer: string | null) {
  if (!referrer) {
    return 'Direct'
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./i, '')
  } catch {
    return referrer
  }
}

function replaceAt<T>(items: T[], index: number, nextItem: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index)
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const currentItem = nextItems[index]
  nextItems[index] = nextItems[nextIndex]
  nextItems[nextIndex] = currentItem
  return nextItems
}

function parseNumberInput(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toOptionalString(value: string) {
  return value.length > 0 ? value : undefined
}

function createEmptyGalleryImage(): GalleryImage {
  return {
    label: '',
    title: '',
    description: '',
    imageUrl: '',
    alt: '',
    replacementHint: '',
  }
}

function createEmptyMetric(): ProfileMetric {
  return {
    label: '',
    value: '',
    detail: '',
  }
}

function createEmptyFocusArea(): FocusArea {
  return {
    title: '',
    description: '',
  }
}

function createEmptySkill(): SkillItem {
  return {
    name: '',
    level: 50,
    category: '',
  }
}

function createEmptyExperienceItem(): ExperienceItem {
  return {
    period: '',
    title: '',
    company: '',
    summary: '',
    highlights: [''],
  }
}

function createEmptyProject(): ProjectItem {
  return {
    title: '',
    blurb: '',
    stack: [''],
    links: {},
  }
}

function createEmptySocial(): SocialItem {
  return {
    label: '',
    href: '',
  }
}

function TextField({ label, value, onChange, placeholder, className }: TextFieldProps) {
  return (
    <label className={`admin-field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="text" value={value} />
    </label>
  )
}

function TextAreaField({ label, value, onChange, placeholder, className }: TextFieldProps) {
  return (
    <label className={`admin-field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <textarea onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} value={value} />
    </label>
  )
}

function NumberField({ label, value, onChange, className, min, max, step }: NumberFieldProps) {
  return (
    <label className={`admin-field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
    </label>
  )
}

function EditorSection({ id, kicker, title, description, children }: EditorSectionProps) {
  return (
    <section className="admin-edit-section" id={id}>
      <div className="admin-edit-section-head">
        <div>
          <p className="card-kicker">{kicker}</p>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ItemActions({ index, length, onMove, onRemove }: ItemActionsProps) {
  return (
    <div className="admin-item-actions">
      <button className="ghost-button admin-item-button" disabled={index === 0} onClick={() => onMove(-1)} type="button">
        Up
      </button>
      <button
        className="ghost-button admin-item-button"
        disabled={index === length - 1}
        onClick={() => onMove(1)}
        type="button"
      >
        Down
      </button>
      <button className="ghost-button admin-item-button admin-danger-button" onClick={onRemove} type="button">
        Remove
      </button>
    </div>
  )
}

function StringListEditor({
  items,
  addLabel,
  emptyLabel,
  itemLabel,
  onAdd,
  onChangeItem,
  onMoveItem,
  onRemoveItem,
}: StringListEditorProps) {
  return (
    <div className="admin-list-stack">
      {items.length > 0 ? (
        items.map((item, index) => (
          <article className="admin-item-card" key={`${itemLabel}-${index}`}>
            <div className="admin-item-head">
              <strong>
                {itemLabel} {index + 1}
              </strong>
              <ItemActions
                index={index}
                length={items.length}
                onMove={(direction) => onMoveItem(index, direction)}
                onRemove={() => onRemoveItem(index)}
              />
            </div>

            <TextField
              label={`${itemLabel} text`}
              onChange={(value) => onChangeItem(index, value)}
              value={item}
            />
          </article>
        ))
      ) : (
        <p className="admin-empty-state">{emptyLabel}</p>
      )}

      <button className="ghost-button admin-add-button" onClick={onAdd} type="button">
        {addLabel}
      </button>
    </div>
  )
}

async function requestJson<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const url = buildApiUrl(path)

  if (!url) {
    throw new Error('Admin page requires the backend API. Set VITE_API_BASE_URL before using it in production.')
  }

  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...init,
    headers,
  })
  const rawBody = await response.text()
  const payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null

  if (!response.ok) {
    throw new Error(
      typeof payload?.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`,
    )
  }

  return payload as T
}

export function AdminPage() {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [authState, setAuthState] = useState<'checking' | 'logged-out' | 'ready'>(() =>
    readStoredToken() ? 'checking' : 'logged-out',
  )
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [busy, setBusy] = useState<BusyState>('idle')
  const [draftProfile, setDraftProfile] = useState<ProfileResponse | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [activeEditorSection, setActiveEditorSection] = useState<EditorSectionId>('editor-identity')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<AdminSessionResponse | null>(null)
  const [analytics, setAnalytics] = useState<ProfileAnalyticsResponse | null>(null)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  function syncDraftProfile(profile: ProfileResponse | null) {
    setDraftProfile(profile)
    setEditorValue(profile ? JSON.stringify(profile, null, 2) : '')
  }

  function updateDraft(updater: (current: ProfileResponse) => ProfileResponse) {
    setDraftProfile((current) => {
      if (!current) {
        return current
      }

      const nextProfile = updater(current)
      setEditorValue(JSON.stringify(nextProfile, null, 2))
      return nextProfile
    })
  }

  function updateIdentityField(field: keyof ProfileResponse['identity'], value: string) {
    updateDraft((current) => ({
      ...current,
      identity: {
        ...current.identity,
        [field]: value,
      },
    }))
  }

  function updateLocationField(field: keyof SavedLocation, value: SavedLocation[keyof SavedLocation]) {
    updateDraft((current) => ({
      ...current,
      location: {
        ...current.location,
        [field]: value,
      },
    }))
  }

  function updateStringList(section: StringListSectionKey, index: number, value: string) {
    updateDraft((current) => ({
      ...current,
      [section]: replaceAt(current[section], index, value),
    }))
  }

  function addStringListItem(section: StringListSectionKey) {
    updateDraft((current) => ({
      ...current,
      [section]: [...current[section], ''],
    }))
  }

  function removeStringListItem(section: StringListSectionKey, index: number) {
    updateDraft((current) => ({
      ...current,
      [section]: removeAt(current[section], index),
    }))
  }

  function moveStringListItem(section: StringListSectionKey, index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      [section]: moveItem(current[section], index, direction),
    }))
  }

  function updateGalleryField(index: number, field: keyof GalleryImage, value: string) {
    updateDraft((current) => ({
      ...current,
      gallery: replaceAt(current.gallery, index, {
        ...current.gallery[index],
        [field]: value,
      }),
    }))
  }

  function updateMetricField(index: number, field: keyof ProfileMetric, value: string) {
    updateDraft((current) => ({
      ...current,
      metrics: replaceAt(current.metrics, index, {
        ...current.metrics[index],
        [field]: value,
      }),
    }))
  }

  function updateFocusAreaField(index: number, field: keyof FocusArea, value: string) {
    updateDraft((current) => ({
      ...current,
      focusAreas: replaceAt(current.focusAreas, index, {
        ...current.focusAreas[index],
        [field]: value,
      }),
    }))
  }

  function updateSkillField<K extends keyof SkillItem>(index: number, field: K, value: SkillItem[K]) {
    updateDraft((current) => ({
      ...current,
      skills: replaceAt(current.skills, index, {
        ...current.skills[index],
        [field]: value,
      }),
    }))
  }

  function updateExperienceField<K extends keyof ExperienceItem>(index: number, field: K, value: ExperienceItem[K]) {
    updateDraft((current) => ({
      ...current,
      experience: replaceAt(current.experience, index, {
        ...current.experience[index],
        [field]: value,
      }),
    }))
  }

  function updateExperienceHighlight(experienceIndex: number, highlightIndex: number, value: string) {
    updateDraft((current) => ({
      ...current,
      experience: replaceAt(current.experience, experienceIndex, {
        ...current.experience[experienceIndex],
        highlights: replaceAt(current.experience[experienceIndex].highlights, highlightIndex, value),
      }),
    }))
  }

  function addExperienceHighlight(experienceIndex: number) {
    updateDraft((current) => ({
      ...current,
      experience: replaceAt(current.experience, experienceIndex, {
        ...current.experience[experienceIndex],
        highlights: [...current.experience[experienceIndex].highlights, ''],
      }),
    }))
  }

  function removeExperienceHighlight(experienceIndex: number, highlightIndex: number) {
    updateDraft((current) => ({
      ...current,
      experience: replaceAt(current.experience, experienceIndex, {
        ...current.experience[experienceIndex],
        highlights: removeAt(current.experience[experienceIndex].highlights, highlightIndex),
      }),
    }))
  }

  function moveExperienceHighlight(experienceIndex: number, highlightIndex: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      experience: replaceAt(current.experience, experienceIndex, {
        ...current.experience[experienceIndex],
        highlights: moveItem(current.experience[experienceIndex].highlights, highlightIndex, direction),
      }),
    }))
  }

  function updateProjectField<K extends keyof ProjectItem>(index: number, field: K, value: ProjectItem[K]) {
    updateDraft((current) => ({
      ...current,
      projects: replaceAt(current.projects, index, {
        ...current.projects[index],
        [field]: value,
      }),
    }))
  }

  function updateProjectStack(index: number, stackIndex: number, value: string) {
    updateDraft((current) => ({
      ...current,
      projects: replaceAt(current.projects, index, {
        ...current.projects[index],
        stack: replaceAt(current.projects[index].stack, stackIndex, value),
      }),
    }))
  }

  function addProjectStack(index: number) {
    updateDraft((current) => ({
      ...current,
      projects: replaceAt(current.projects, index, {
        ...current.projects[index],
        stack: [...current.projects[index].stack, ''],
      }),
    }))
  }

  function removeProjectStack(index: number, stackIndex: number) {
    updateDraft((current) => ({
      ...current,
      projects: replaceAt(current.projects, index, {
        ...current.projects[index],
        stack: removeAt(current.projects[index].stack, stackIndex),
      }),
    }))
  }

  function moveProjectStack(index: number, stackIndex: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      projects: replaceAt(current.projects, index, {
        ...current.projects[index],
        stack: moveItem(current.projects[index].stack, stackIndex, direction),
      }),
    }))
  }

  function updateProjectLink(index: number, field: 'live' | 'github', value: string) {
    updateDraft((current) => ({
      ...current,
      projects: replaceAt(current.projects, index, {
        ...current.projects[index],
        links: {
          ...current.projects[index].links,
          [field]: toOptionalString(value),
        },
      }),
    }))
  }

  function updateSocialField(index: number, field: keyof SocialItem, value: string) {
    updateDraft((current) => ({
      ...current,
      socials: replaceAt(current.socials, index, {
        ...current.socials[index],
        [field]: value,
      }),
    }))
  }

  function addGalleryItem() {
    updateDraft((current) => ({
      ...current,
      gallery: [...current.gallery, createEmptyGalleryImage()],
    }))
  }

  function addMetricItem() {
    updateDraft((current) => ({
      ...current,
      metrics: [...current.metrics, createEmptyMetric()],
    }))
  }

  function addFocusAreaItem() {
    updateDraft((current) => ({
      ...current,
      focusAreas: [...current.focusAreas, createEmptyFocusArea()],
    }))
  }

  function addSkillItem() {
    updateDraft((current) => ({
      ...current,
      skills: [...current.skills, createEmptySkill()],
    }))
  }

  function addExperienceItem() {
    updateDraft((current) => ({
      ...current,
      experience: [...current.experience, createEmptyExperienceItem()],
    }))
  }

  function addProjectItem() {
    updateDraft((current) => ({
      ...current,
      projects: [...current.projects, createEmptyProject()],
    }))
  }

  function addSocialItem() {
    updateDraft((current) => ({
      ...current,
      socials: [...current.socials, createEmptySocial()],
    }))
  }

  function removeGalleryItem(index: number) {
    updateDraft((current) => ({
      ...current,
      gallery: removeAt(current.gallery, index),
    }))
  }

  function removeMetricItem(index: number) {
    updateDraft((current) => ({
      ...current,
      metrics: removeAt(current.metrics, index),
    }))
  }

  function removeFocusAreaItem(index: number) {
    updateDraft((current) => ({
      ...current,
      focusAreas: removeAt(current.focusAreas, index),
    }))
  }

  function removeSkillItem(index: number) {
    updateDraft((current) => ({
      ...current,
      skills: removeAt(current.skills, index),
    }))
  }

  function removeExperienceItem(index: number) {
    updateDraft((current) => ({
      ...current,
      experience: removeAt(current.experience, index),
    }))
  }

  function removeProjectItem(index: number) {
    updateDraft((current) => ({
      ...current,
      projects: removeAt(current.projects, index),
    }))
  }

  function removeSocialItem(index: number) {
    updateDraft((current) => ({
      ...current,
      socials: removeAt(current.socials, index),
    }))
  }

  function moveGalleryItem(index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      gallery: moveItem(current.gallery, index, direction),
    }))
  }

  function moveMetricItem(index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      metrics: moveItem(current.metrics, index, direction),
    }))
  }

  function moveFocusAreaItem(index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      focusAreas: moveItem(current.focusAreas, index, direction),
    }))
  }

  function moveSkillItem(index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      skills: moveItem(current.skills, index, direction),
    }))
  }

  function moveExperienceItem(index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      experience: moveItem(current.experience, index, direction),
    }))
  }

  function moveProjectItem(index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      projects: moveItem(current.projects, index, direction),
    }))
  }

  function moveSocialItem(index: number, direction: -1 | 1) {
    updateDraft((current) => ({
      ...current,
      socials: moveItem(current.socials, index, direction),
    }))
  }

  useEffect(() => {
    let cancelled = false

    if (!token) {
      setAuthState('logged-out')
      setSessionInfo(null)
      setAnalytics(null)
      setPreviewOpen(false)
      syncDraftProfile(null)
      return () => {
        cancelled = true
      }
    }

    async function bootstrap() {
      setAuthState('checking')
      setAuthMessage(null)

      try {
        const [session, currentProfile, currentAnalytics] = await Promise.all([
          requestJson<AdminSessionResponse>('/admin/session', {}, token ?? undefined),
          requestJson<ProfileApiResponse>('/admin/profile', {}, token ?? undefined),
          requestJson<ProfileAnalyticsResponse>('/admin/analytics', {}, token ?? undefined),
        ])

        if (cancelled) {
          return
        }

        const profile = stripProfileMeta(currentProfile)
        setSessionInfo(session)
        syncDraftProfile(profile)
        setAnalytics(currentAnalytics)
        setAuthState('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        persistToken(null)
        setToken(null)
        setSessionInfo(null)
        setAnalytics(null)
        setPreviewOpen(false)
        syncDraftProfile(null)
        setAuthState('logged-out')
        setAuthMessage(error instanceof Error ? error.message : 'Admin session expired.')
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!previewOpen || typeof document === 'undefined') {
      return undefined
    }

    const originalOverflow = document.body.style.overflow

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPreviewOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewOpen])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy('login')
    setAuthMessage(null)
    setStatus(null)

    try {
      const loginResponse = await requestJson<AdminLoginResponse>('/admin/login', {
        body: JSON.stringify(loginForm),
        method: 'POST',
      })

      persistToken(loginResponse.token)
      setToken(loginResponse.token)
      setLoginForm((current) => ({
        ...current,
        password: '',
      }))
      setStatus({
        tone: 'success',
        message: 'Signed in. Loading the protected profile editor.',
      })
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setBusy('idle')
    }
  }

  async function handleLogout() {
    const currentToken = token

    setBusy('logout')
    setStatus(null)

    try {
      if (currentToken) {
        await requestJson('/admin/logout', { method: 'POST' }, currentToken)
      }
    } catch {
      // Token removal on the client is enough to close access.
    } finally {
      persistToken(null)
      setToken(null)
      setSessionInfo(null)
      setAnalytics(null)
      setPreviewOpen(false)
      syncDraftProfile(null)
      setBusy('idle')
      setAuthMessage(null)
    }
  }

  async function handleSave() {
    if (!token || !draftProfile) {
      return
    }

    setBusy('save')
    setStatus(null)

    try {
      const savedProfile = await requestJson<ProfileApiResponse>(
        '/admin/profile',
        {
          body: JSON.stringify(draftProfile),
          method: 'PUT',
        },
        token,
      )

      syncDraftProfile(stripProfileMeta(savedProfile))
      setStatus({
        tone: 'success',
        message: 'Profile changes were saved to the backend store.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not save the profile changes.',
      })
    } finally {
      setBusy('idle')
    }
  }

  async function handleReset() {
    if (!token) {
      return
    }

    setBusy('reset')
    setStatus(null)

    try {
      const resetValue = await requestJson<ProfileApiResponse>(
        '/admin/profile/reset',
        {
          method: 'POST',
        },
        token,
      )

      syncDraftProfile(stripProfileMeta(resetValue))
      setStatus({
        tone: 'success',
        message: 'Profile data was reset to the default payload.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not reset the profile data.',
      })
    } finally {
      setBusy('idle')
    }
  }

  async function handleRefreshAnalytics() {
    if (!token) {
      return
    }

    setBusy('refresh-analytics')
    setStatus(null)

    try {
      const nextAnalytics = await requestJson<ProfileAnalyticsResponse>('/admin/analytics', {}, token)
      setAnalytics(nextAnalytics)
      setStatus({
        tone: 'success',
        message: 'Analytics data was refreshed.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not refresh analytics.',
      })
    } finally {
      setBusy('idle')
    }
  }

  function handleFormatJson() {
    try {
      const parsedProfile = JSON.parse(editorValue) as ProfileResponse
      setEditorValue(JSON.stringify(parsedProfile, null, 2))
      setStatus({
        tone: 'success',
        message: 'Raw JSON was formatted.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'The raw JSON is invalid.',
      })
    }
  }

  function handleApplyJson() {
    try {
      const parsedProfile = JSON.parse(editorValue) as ProfileResponse
      syncDraftProfile(parsedProfile)
      setStatus({
        tone: 'success',
        message: 'Raw JSON changes were applied to the sectioned editor.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'The raw JSON is invalid.',
      })
    }
  }

  const analyticsCards = analytics
    ? [
        {
          label: 'Total views',
          value: formatNumber(analytics.summary.totalViews),
          detail: 'Total recorded views across the current data store.',
        },
        {
          label: 'Last 24 hours',
          value: formatNumber(analytics.summary.viewsLast24Hours),
          detail: 'Views captured during the most recent 24 hour window.',
        },
        {
          label: 'Unique IPs',
          value: formatNumber(analytics.summary.uniqueVisitors),
          detail: 'Calculated from the visit log currently retained.',
        },
        {
          label: 'Tracked log size',
          value: formatNumber(analytics.summary.trackedVisits),
          detail: `Keeping up to ${formatNumber(analytics.summary.storageLimit)} recent visits.`,
        },
        {
          label: 'Last view',
          value: formatDateTime(analytics.summary.lastViewedAt),
          detail: 'Most recent tracked view time.',
        },
      ]
    : []

  const editorNavItems: Array<{ id: EditorSectionId; label: string; description: string }> = [
    {
      id: 'editor-identity',
      label: 'Identity',
      description: 'Hero text, contact info, and social links.',
    },
    {
      id: 'editor-location',
      label: 'Location + Gallery',
      description: 'Map details and image metadata.',
    },
    {
      id: 'editor-highlights',
      label: 'Highlights',
      description: 'Quick facts, metrics, and focus cards.',
    },
    {
      id: 'editor-skills',
      label: 'Skills + Experience',
      description: 'Skill bars and timeline content.',
    },
    {
      id: 'editor-projects',
      label: 'Projects',
      description: 'Case study cards, links, and stack tags.',
    },
    {
      id: 'editor-footer',
      label: 'Footer content',
      description: 'Principles and current status lines.',
    },
    {
      id: 'editor-json',
      label: 'Raw JSON',
      description: 'Advanced fallback for full payload edits.',
    },
  ]

  const activeEditorItem =
    editorNavItems.find((item) => item.id === activeEditorSection) ?? editorNavItems[0]

  return (
    <Shell accent="forest">
      <div className="page admin-page">
        <header className="cyber-topbar admin-topbar">
          <a className="brand-mark" href="/">
            md.
          </a>

          <div className="admin-topbar-copy">
            <span>Secret route</span>
            <strong>{ADMIN_ROUTE}</strong>
          </div>

          <div className="admin-topbar-actions">
            <a className="ghost-button" href="/">
              View profile
            </a>

            {authState === 'ready' && (
              <button className="ghost-button" onClick={handleLogout} type="button">
                {busy === 'logout' ? 'Signing out...' : 'Sign out'}
              </button>
            )}
          </div>
        </header>

        {authState === 'checking' && (
          <section className="panel loading-card">
            <p className="card-kicker">Admin session</p>
            <h1>Checking access...</h1>
            <p>Validating the current token, loading the profile payload, and reading analytics.</p>
          </section>
        )}

        {authState === 'logged-out' && (
          <section className="panel admin-login-card">
            <p className="card-kicker">Restricted access</p>
            <h1>Sign in to open the profile admin.</h1>
            <p className="admin-copy">
              Only the configured admin account can open this page. Public visitors can still read the
              profile, but they cannot change the data source or open the analytics dashboard.
            </p>

            <form className="admin-login-form" onSubmit={handleLogin}>
              <label className="admin-field">
                <span>Email</span>
                <input
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  type="email"
                  value={loginForm.email}
                />
              </label>

              <label className="admin-field">
                <span>Password</span>
                <input
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  type="password"
                  value={loginForm.password}
                />
              </label>

              <button className="primary-button admin-submit-button" disabled={busy === 'login'} type="submit">
                {busy === 'login' ? 'Signing in...' : 'Open admin'}
              </button>
            </form>

            {authMessage && <p className="admin-status admin-status-error">{authMessage}</p>}
            {status && <p className={`admin-status admin-status-${status.tone}`}>{status.message}</p>}
          </section>
        )}

        {authState === 'ready' && draftProfile && (
          <>
            <section className="panel admin-hero-panel">
              <div>
                <p className="card-kicker">Control room</p>
                <h1>Edit the profile with grouped forms instead of raw script lines.</h1>
                <p className="admin-copy">
                  Each content area now has its own section, so you can update identity, images, skills,
                  experience, and projects without editing the entire payload by hand.
                </p>
              </div>

              <div className="admin-hero-actions">
                <button className="ghost-button" onClick={() => setPreviewOpen(true)} type="button">
                  Open preview
                </button>
                <button className="primary-button" disabled={busy === 'save'} onClick={handleSave} type="button">
                  {busy === 'save' ? 'Saving...' : 'Save changes'}
                </button>
                <button className="ghost-button" disabled={busy === 'reset'} onClick={handleReset} type="button">
                  {busy === 'reset' ? 'Resetting...' : 'Reset to default'}
                </button>
                <button
                  className="ghost-button"
                  disabled={busy === 'refresh-analytics'}
                  onClick={handleRefreshAnalytics}
                  type="button"
                >
                  {busy === 'refresh-analytics' ? 'Refreshing...' : 'Refresh analytics'}
                </button>
              </div>

              <div className="admin-session-strip">
                <span>Signed in as {sessionInfo?.email ?? 'admin'}</span>
                {sessionInfo?.expiresAt && <span>Session expires {formatDateTime(sessionInfo.expiresAt)}</span>}
                {analytics?.updatedAt && <span>Analytics updated {formatDateTime(analytics.updatedAt)}</span>}
              </div>

              {status && <p className={`admin-status admin-status-${status.tone}`}>{status.message}</p>}
            </section>

            <section className="panel admin-overview-panel">
              <div className="admin-section-head">
                <div>
                  <p className="card-kicker">Analytics</p>
                  <h2>Traffic overview</h2>
                  <p>
                    Geo data is approximate. It comes from proxy headers when available and falls back to IP
                    lookup on the backend for public requests.
                  </p>
                </div>
              </div>

              {analytics ? (
                <>
                  <div className="admin-analytics-grid">
                    {analyticsCards.map((card) => (
                      <article className="admin-analytic-card" key={card.label}>
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                        <p>{card.detail}</p>
                      </article>
                    ))}
                  </div>

                  <div className="admin-insight-grid">
                    <article className="admin-insight-card">
                      <span>Top sources</span>
                      <div className="admin-pill-list">
                        {analytics.summary.topSources.length > 0 ? (
                          analytics.summary.topSources.map((bucket) => (
                            <span className="admin-pill" key={`source-${bucket.label}`}>
                              {formatBucketLabel(bucket)}
                            </span>
                          ))
                        ) : (
                          <span className="admin-pill">No source data yet</span>
                        )}
                      </div>
                    </article>

                    <article className="admin-insight-card">
                      <span>Top countries</span>
                      <div className="admin-pill-list">
                        {analytics.summary.topCountries.length > 0 ? (
                          analytics.summary.topCountries.map((bucket) => (
                            <span className="admin-pill" key={`country-${bucket.label}`}>
                              {formatBucketLabel(bucket)}
                            </span>
                          ))
                        ) : (
                          <span className="admin-pill">No location data yet</span>
                        )}
                      </div>
                    </article>
                  </div>
                </>
              ) : (
                <p className="admin-empty-state">Analytics is not ready yet.</p>
              )}
            </section>

            <section className="panel admin-section-card">
              <div className="admin-section-head">
                <div>
                  <p className="card-kicker">Recent visits</p>
                  <h2>Tracked view log</h2>
                  <p>
                    Each row is one recorded view event with source, IP, device, path, referrer, and rough
                    location details.
                  </p>
                </div>
              </div>

              {analytics && analytics.recentVisits.length > 0 ? (
                <div className="admin-visit-table-wrap">
                  <table className="admin-visit-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Source</th>
                        <th>IP</th>
                        <th>Location</th>
                        <th>Device</th>
                        <th>Path</th>
                        <th>Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentVisits.map((visit) => (
                        <tr key={visit.id}>
                          <td>{formatDateTime(visit.viewedAt)}</td>
                          <td>
                            <div className="admin-table-stack">
                              <strong>{visit.source}</strong>
                              <span>{visit.location.source}</span>
                            </div>
                          </td>
                          <td>{visit.ip}</td>
                          <td>{formatVisitLocation(visit)}</td>
                          <td>
                            <div className="admin-table-stack">
                              <strong>{visit.deviceType}</strong>
                              <span>{formatVisitDevice(visit)}</span>
                            </div>
                          </td>
                          <td>{visit.path}</td>
                          <td>
                            <div className="admin-table-stack">
                              <strong>{formatReferrerHost(visit.referrer)}</strong>
                              <span title={visit.referrer ?? undefined}>
                                {visit.referrer ?? 'Direct / no referrer'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-empty-state">
                  No tracked visits yet. Open the public profile in another tab to generate test data.
                </p>
              )}
            </section>

            <section className="panel admin-editor-panel">
              <div className="admin-section-head">
                <div>
                  <p className="card-kicker">Profile editor</p>
                  <h2>Sectioned admin form</h2>
                  <p>
                    Edit each content block separately. Raw JSON is still available below as an advanced
                    fallback, but the main workflow is now form based.
                  </p>
                </div>
              </div>

              <div className="admin-workspace">
                <aside className="admin-editor-rail">
                  <div className="admin-rail-card">
                    <p className="card-kicker">Editor tabs</p>
                    <h3>Jump to a section</h3>
                    <p>Only one content group stays open at a time, so the editor does not stretch too far down.</p>

                    <nav className="admin-editor-nav" aria-label="Profile editor sections">
                      {editorNavItems.map((item) => (
                        <button
                          aria-pressed={activeEditorSection === item.id}
                          className={`admin-editor-chip${activeEditorSection === item.id ? ' admin-editor-chip-active' : ''}`}
                          key={item.id}
                          onClick={() => setActiveEditorSection(item.id)}
                          type="button"
                        >
                          <span>{item.label}</span>
                          <small>{item.description}</small>
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="admin-rail-card">
                    <p className="card-kicker">Preview</p>
                    <h3>Open it when needed</h3>
                    <p>
                      The preview now opens in a popup instead of staying pinned on the page all the time.
                    </p>
                    <button className="ghost-button admin-preview-trigger" onClick={() => setPreviewOpen(true)} type="button">
                      Open preview popup
                    </button>
                  </div>
                </aside>

                <div className="admin-editor-main">
                  <div className="admin-active-editor-card">
                    <p className="card-kicker">Current tab</p>
                    <h3>{activeEditorItem.label}</h3>
                    <p>{activeEditorItem.description}</p>
                  </div>

                  <div className="admin-editor-stack">
                    {activeEditorSection === 'editor-identity' && (
                      <EditorSection
                        description="Main hero lines, identity details, contact info, and social links."
                        id="editor-identity"
                        kicker="General"
                        title="Identity and contact"
                      >
                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Cover headline</strong>
                          <p>Short lines used across the top profile section.</p>
                        </div>
                        <StringListEditor
                          addLabel="Add headline"
                          emptyLabel="No headline lines yet."
                          itemLabel="Headline"
                          items={draftProfile.coverHeadline}
                          onAdd={() => addStringListItem('coverHeadline')}
                          onChangeItem={(index, value) => updateStringList('coverHeadline', index, value)}
                          onMoveItem={(index, direction) => moveStringListItem('coverHeadline', index, direction)}
                          onRemoveItem={(index) => removeStringListItem('coverHeadline', index)}
                        />
                      </div>

                      <div className="admin-form-grid">
                        <TextField label="Full name" onChange={(value) => updateIdentityField('name', value)} value={draftProfile.identity.name} />
                        <TextField label="Initials" onChange={(value) => updateIdentityField('initials', value)} value={draftProfile.identity.initials} />
                        <TextField label="Handle" onChange={(value) => updateIdentityField('handle', value)} value={draftProfile.identity.handle} />
                        <TextField label="Role" onChange={(value) => updateIdentityField('role', value)} value={draftProfile.identity.role} />
                        <TextField label="Email" onChange={(value) => updateIdentityField('email', value)} value={draftProfile.identity.email} />
                        <TextField label="Timezone" onChange={(value) => updateIdentityField('timezone', value)} value={draftProfile.identity.timezone} />
                        <TextField
                          className="admin-field-full"
                          label="Tagline"
                          onChange={(value) => updateIdentityField('tagline', value)}
                          value={draftProfile.identity.tagline}
                        />
                        <TextAreaField
                          className="admin-field-full"
                          label="Bio"
                          onChange={(value) => updateIdentityField('bio', value)}
                          value={draftProfile.identity.bio}
                        />
                        <TextField
                          className="admin-field-full"
                          label="Availability"
                          onChange={(value) => updateIdentityField('availability', value)}
                          value={draftProfile.identity.availability}
                        />
                        <TextField
                          className="admin-field-full"
                          label="Location hint"
                          onChange={(value) => updateIdentityField('locationHint', value)}
                          value={draftProfile.identity.locationHint}
                        />
                      </div>

                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Social links</strong>
                          <p>Buttons or links shown around the profile and contact area.</p>
                        </div>

                        <div className="admin-list-stack">
                          {draftProfile.socials.length > 0 ? (
                            draftProfile.socials.map((item, index) => (
                              <article className="admin-item-card" key={`social-${index}`}>
                                <div className="admin-item-head">
                                  <strong>Social {index + 1}</strong>
                                  <ItemActions
                                    index={index}
                                    length={draftProfile.socials.length}
                                    onMove={(direction) => moveSocialItem(index, direction)}
                                    onRemove={() => removeSocialItem(index)}
                                  />
                                </div>

                                <div className="admin-form-grid">
                                  <TextField label="Label" onChange={(value) => updateSocialField(index, 'label', value)} value={item.label} />
                                  <TextField label="URL or mailto" onChange={(value) => updateSocialField(index, 'href', value)} value={item.href} />
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="admin-empty-state">No social links yet.</p>
                          )}

                          <button className="ghost-button admin-add-button" onClick={addSocialItem} type="button">
                            Add social link
                          </button>
                        </div>
                      </div>
                      </EditorSection>
                    )}

                    {activeEditorSection === 'editor-location' && (
                      <EditorSection
                        description="Saved location values and gallery metadata used by the frontend."
                        id="editor-location"
                        kicker="Media"
                        title="Location and gallery"
                      >
                      <div className="admin-form-grid">
                        <TextField label="Location label" onChange={(value) => updateLocationField('label', value)} value={draftProfile.location.label} />
                        <TextField
                          className="admin-field-full"
                          label="Location description"
                          onChange={(value) => updateLocationField('description', value)}
                          value={draftProfile.location.description}
                        />
                        <NumberField
                          label="Latitude"
                          onChange={(value) => updateLocationField('latitude', parseNumberInput(value, draftProfile.location.latitude))}
                          step={0.000001}
                          value={draftProfile.location.latitude}
                        />
                        <NumberField
                          label="Longitude"
                          onChange={(value) => updateLocationField('longitude', parseNumberInput(value, draftProfile.location.longitude))}
                          step={0.000001}
                          value={draftProfile.location.longitude}
                        />
                      </div>

                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Gallery items</strong>
                          <p>Image metadata only. The actual files still live under the frontend public folder.</p>
                        </div>

                        <div className="admin-list-stack">
                          {draftProfile.gallery.length > 0 ? (
                            draftProfile.gallery.map((item, index) => (
                              <article className="admin-item-card" key={`gallery-${index}`}>
                                <div className="admin-item-head">
                                  <strong>Image {index + 1}</strong>
                                  <ItemActions
                                    index={index}
                                    length={draftProfile.gallery.length}
                                    onMove={(direction) => moveGalleryItem(index, direction)}
                                    onRemove={() => removeGalleryItem(index)}
                                  />
                                </div>

                                <div className="admin-form-grid">
                                  <TextField label="Label" onChange={(value) => updateGalleryField(index, 'label', value)} value={item.label} />
                                  <TextField label="Title" onChange={(value) => updateGalleryField(index, 'title', value)} value={item.title} />
                                  <TextField
                                    className="admin-field-full"
                                    label="Image URL"
                                    onChange={(value) => updateGalleryField(index, 'imageUrl', value)}
                                    value={item.imageUrl}
                                  />
                                  <TextField
                                    className="admin-field-full"
                                    label="Alt text"
                                    onChange={(value) => updateGalleryField(index, 'alt', value)}
                                    value={item.alt}
                                  />
                                  <TextAreaField
                                    className="admin-field-full"
                                    label="Description"
                                    onChange={(value) => updateGalleryField(index, 'description', value)}
                                    value={item.description}
                                  />
                                  <TextField
                                    className="admin-field-full"
                                    label="Replacement hint"
                                    onChange={(value) => updateGalleryField(index, 'replacementHint', value)}
                                    value={item.replacementHint}
                                  />
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="admin-empty-state">No gallery items yet.</p>
                          )}

                          <button className="ghost-button admin-add-button" onClick={addGalleryItem} type="button">
                            Add gallery item
                          </button>
                        </div>
                      </div>
                      </EditorSection>
                    )}

                    {activeEditorSection === 'editor-highlights' && (
                      <EditorSection
                        description="Facts, metrics, and focus cards shown through the landing page."
                        id="editor-highlights"
                        kicker="Highlights"
                        title="Facts, metrics, and focus areas"
                      >
                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Quick facts</strong>
                          <p>Short chips that summarize stack or deployment details.</p>
                        </div>
                        <StringListEditor
                          addLabel="Add quick fact"
                          emptyLabel="No quick facts yet."
                          itemLabel="Fact"
                          items={draftProfile.quickFacts}
                          onAdd={() => addStringListItem('quickFacts')}
                          onChangeItem={(index, value) => updateStringList('quickFacts', index, value)}
                          onMoveItem={(index, direction) => moveStringListItem('quickFacts', index, direction)}
                          onRemoveItem={(index) => removeStringListItem('quickFacts', index)}
                        />
                      </div>

                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Metrics</strong>
                          <p>Small cards that describe build, deployment, and system details.</p>
                        </div>

                        <div className="admin-list-stack">
                          {draftProfile.metrics.length > 0 ? (
                            draftProfile.metrics.map((item, index) => (
                              <article className="admin-item-card" key={`metric-${index}`}>
                                <div className="admin-item-head">
                                  <strong>Metric {index + 1}</strong>
                                  <ItemActions
                                    index={index}
                                    length={draftProfile.metrics.length}
                                    onMove={(direction) => moveMetricItem(index, direction)}
                                    onRemove={() => removeMetricItem(index)}
                                  />
                                </div>

                                <div className="admin-form-grid">
                                  <TextField label="Label" onChange={(value) => updateMetricField(index, 'label', value)} value={item.label} />
                                  <TextField label="Value" onChange={(value) => updateMetricField(index, 'value', value)} value={item.value} />
                                  <TextAreaField
                                    className="admin-field-full"
                                    label="Detail"
                                    onChange={(value) => updateMetricField(index, 'detail', value)}
                                    value={item.detail}
                                  />
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="admin-empty-state">No metric cards yet.</p>
                          )}

                          <button className="ghost-button admin-add-button" onClick={addMetricItem} type="button">
                            Add metric
                          </button>
                        </div>
                      </div>

                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Focus areas</strong>
                          <p>Service cards used in the portfolio sections.</p>
                        </div>

                        <div className="admin-list-stack">
                          {draftProfile.focusAreas.length > 0 ? (
                            draftProfile.focusAreas.map((item, index) => (
                              <article className="admin-item-card" key={`focus-${index}`}>
                                <div className="admin-item-head">
                                  <strong>Focus area {index + 1}</strong>
                                  <ItemActions
                                    index={index}
                                    length={draftProfile.focusAreas.length}
                                    onMove={(direction) => moveFocusAreaItem(index, direction)}
                                    onRemove={() => removeFocusAreaItem(index)}
                                  />
                                </div>

                                <div className="admin-form-grid">
                                  <TextField label="Title" onChange={(value) => updateFocusAreaField(index, 'title', value)} value={item.title} />
                                  <TextAreaField
                                    className="admin-field-full"
                                    label="Description"
                                    onChange={(value) => updateFocusAreaField(index, 'description', value)}
                                    value={item.description}
                                  />
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="admin-empty-state">No focus areas yet.</p>
                          )}

                          <button className="ghost-button admin-add-button" onClick={addFocusAreaItem} type="button">
                            Add focus area
                          </button>
                        </div>
                      </div>
                      </EditorSection>
                    )}

                    {activeEditorSection === 'editor-skills' && (
                      <EditorSection
                        description="Skill levels and career timeline entries."
                        id="editor-skills"
                        kicker="Career"
                        title="Skills and experience"
                      >
                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Skills</strong>
                          <p>Progress bars shown in the skill area.</p>
                        </div>

                        <div className="admin-list-stack">
                          {draftProfile.skills.length > 0 ? (
                            draftProfile.skills.map((item, index) => (
                              <article className="admin-item-card" key={`skill-${index}`}>
                                <div className="admin-item-head">
                                  <strong>Skill {index + 1}</strong>
                                  <ItemActions
                                    index={index}
                                    length={draftProfile.skills.length}
                                    onMove={(direction) => moveSkillItem(index, direction)}
                                    onRemove={() => removeSkillItem(index)}
                                  />
                                </div>

                                <div className="admin-form-grid">
                                  <TextField label="Name" onChange={(value) => updateSkillField(index, 'name', value)} value={item.name} />
                                  <TextField label="Category" onChange={(value) => updateSkillField(index, 'category', value)} value={item.category} />
                                  <NumberField
                                    className="admin-field-full"
                                    label="Level"
                                    max={100}
                                    min={0}
                                    onChange={(value) => updateSkillField(index, 'level', parseNumberInput(value, item.level))}
                                    step={1}
                                    value={item.level}
                                  />
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="admin-empty-state">No skills yet.</p>
                          )}

                          <button className="ghost-button admin-add-button" onClick={addSkillItem} type="button">
                            Add skill
                          </button>
                        </div>
                      </div>

                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Experience</strong>
                          <p>Timeline content with headline details and supporting highlights.</p>
                        </div>

                        <div className="admin-list-stack">
                          {draftProfile.experience.length > 0 ? (
                            draftProfile.experience.map((item, index) => (
                              <article className="admin-item-card" key={`experience-${index}`}>
                                <div className="admin-item-head">
                                  <strong>Experience {index + 1}</strong>
                                  <ItemActions
                                    index={index}
                                    length={draftProfile.experience.length}
                                    onMove={(direction) => moveExperienceItem(index, direction)}
                                    onRemove={() => removeExperienceItem(index)}
                                  />
                                </div>

                                <div className="admin-form-grid">
                                  <TextField label="Period" onChange={(value) => updateExperienceField(index, 'period', value)} value={item.period} />
                                  <TextField label="Title" onChange={(value) => updateExperienceField(index, 'title', value)} value={item.title} />
                                  <TextField label="Company" onChange={(value) => updateExperienceField(index, 'company', value)} value={item.company} />
                                  <TextAreaField
                                    className="admin-field-full"
                                    label="Summary"
                                    onChange={(value) => updateExperienceField(index, 'summary', value)}
                                    value={item.summary}
                                  />
                                </div>

                                <div className="admin-subsection admin-subsection-nested">
                                  <div className="admin-subsection-head">
                                    <strong>Highlights</strong>
                                    <p>Bullet style supporting points for this experience item.</p>
                                  </div>

                                  <div className="admin-list-stack">
                                    {item.highlights.length > 0 ? (
                                      item.highlights.map((highlight, highlightIndex) => (
                                        <article className="admin-item-card admin-item-card-compact" key={`highlight-${index}-${highlightIndex}`}>
                                          <div className="admin-item-head">
                                            <strong>Highlight {highlightIndex + 1}</strong>
                                            <ItemActions
                                              index={highlightIndex}
                                              length={item.highlights.length}
                                              onMove={(direction) => moveExperienceHighlight(index, highlightIndex, direction)}
                                              onRemove={() => removeExperienceHighlight(index, highlightIndex)}
                                            />
                                          </div>

                                          <TextField
                                            label="Highlight text"
                                            onChange={(value) => updateExperienceHighlight(index, highlightIndex, value)}
                                            value={highlight}
                                          />
                                        </article>
                                      ))
                                    ) : (
                                      <p className="admin-empty-state">No highlights yet.</p>
                                    )}

                                    <button
                                      className="ghost-button admin-add-button"
                                      onClick={() => addExperienceHighlight(index)}
                                      type="button"
                                    >
                                      Add highlight
                                    </button>
                                  </div>
                                </div>
                              </article>
                            ))
                          ) : (
                            <p className="admin-empty-state">No experience items yet.</p>
                          )}

                          <button className="ghost-button admin-add-button" onClick={addExperienceItem} type="button">
                            Add experience item
                          </button>
                        </div>
                      </div>
                      </EditorSection>
                    )}

                    {activeEditorSection === 'editor-projects' && (
                      <EditorSection
                        description="Project cards, links, and stack tags."
                        id="editor-projects"
                        kicker="Builds"
                        title="Projects"
                      >
                      <div className="admin-list-stack">
                        {draftProfile.projects.length > 0 ? (
                          draftProfile.projects.map((item, index) => (
                            <article className="admin-item-card" key={`project-${index}`}>
                              <div className="admin-item-head">
                                <strong>Project {index + 1}</strong>
                                <ItemActions
                                  index={index}
                                  length={draftProfile.projects.length}
                                  onMove={(direction) => moveProjectItem(index, direction)}
                                  onRemove={() => removeProjectItem(index)}
                                />
                              </div>

                              <div className="admin-form-grid">
                                <TextField label="Title" onChange={(value) => updateProjectField(index, 'title', value)} value={item.title} />
                                <TextField
                                  label="Live URL"
                                  onChange={(value) => updateProjectLink(index, 'live', value)}
                                  value={item.links.live ?? ''}
                                />
                                <TextField
                                  className="admin-field-full"
                                  label="GitHub URL"
                                  onChange={(value) => updateProjectLink(index, 'github', value)}
                                  value={item.links.github ?? ''}
                                />
                                <TextAreaField
                                  className="admin-field-full"
                                  label="Blurb"
                                  onChange={(value) => updateProjectField(index, 'blurb', value)}
                                  value={item.blurb}
                                />
                              </div>

                              <div className="admin-subsection admin-subsection-nested">
                                <div className="admin-subsection-head">
                                  <strong>Stack tags</strong>
                                  <p>Short stack items shown as pills on the project card.</p>
                                </div>

                                <div className="admin-list-stack">
                                  {item.stack.length > 0 ? (
                                    item.stack.map((stackItem, stackIndex) => (
                                      <article className="admin-item-card admin-item-card-compact" key={`stack-${index}-${stackIndex}`}>
                                        <div className="admin-item-head">
                                          <strong>Stack item {stackIndex + 1}</strong>
                                          <ItemActions
                                            index={stackIndex}
                                            length={item.stack.length}
                                            onMove={(direction) => moveProjectStack(index, stackIndex, direction)}
                                            onRemove={() => removeProjectStack(index, stackIndex)}
                                          />
                                        </div>

                                        <TextField
                                          label="Stack text"
                                          onChange={(value) => updateProjectStack(index, stackIndex, value)}
                                          value={stackItem}
                                        />
                                      </article>
                                    ))
                                  ) : (
                                    <p className="admin-empty-state">No stack items yet.</p>
                                  )}

                                  <button
                                    className="ghost-button admin-add-button"
                                    onClick={() => addProjectStack(index)}
                                    type="button"
                                  >
                                    Add stack item
                                  </button>
                                </div>
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="admin-empty-state">No projects yet.</p>
                        )}

                        <button className="ghost-button admin-add-button" onClick={addProjectItem} type="button">
                          Add project
                        </button>
                      </div>
                      </EditorSection>
                    )}

                    {activeEditorSection === 'editor-footer' && (
                      <EditorSection
                        description="Closing notes and footer style content."
                        id="editor-footer"
                        kicker="Closing"
                        title="Principles and now"
                      >
                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Principles</strong>
                          <p>Core operating points used near the contact area.</p>
                        </div>
                        <StringListEditor
                          addLabel="Add principle"
                          emptyLabel="No principles yet."
                          itemLabel="Principle"
                          items={draftProfile.principles}
                          onAdd={() => addStringListItem('principles')}
                          onChangeItem={(index, value) => updateStringList('principles', index, value)}
                          onMoveItem={(index, direction) => moveStringListItem('principles', index, direction)}
                          onRemoveItem={(index) => removeStringListItem('principles', index)}
                        />
                      </div>

                      <div className="admin-subsection">
                        <div className="admin-subsection-head">
                          <strong>Now</strong>
                          <p>Current status lines that can support fresh updates.</p>
                        </div>
                        <StringListEditor
                          addLabel="Add current update"
                          emptyLabel="No current updates yet."
                          itemLabel="Update"
                          items={draftProfile.now}
                          onAdd={() => addStringListItem('now')}
                          onChangeItem={(index, value) => updateStringList('now', index, value)}
                          onMoveItem={(index, direction) => moveStringListItem('now', index, direction)}
                          onRemoveItem={(index) => removeStringListItem('now', index)}
                        />
                      </div>
                      </EditorSection>
                    )}

                    {activeEditorSection === 'editor-json' && (
                      <EditorSection
                        description="Advanced fallback when you want to paste or compare the full payload."
                        id="editor-json"
                        kicker="Advanced"
                        title="Raw JSON editor"
                      >
                      <div className="admin-raw-editor-actions">
                        <button className="ghost-button" onClick={handleFormatJson} type="button">
                          Format JSON
                        </button>
                        <button className="ghost-button" onClick={handleApplyJson} type="button">
                          Apply JSON to form
                        </button>
                      </div>

                      <p className="admin-copy">
                        The sectioned form is the main source of truth. If you edit raw JSON here, click
                        "Apply JSON to form" before saving.
                      </p>

                      <textarea
                        className="admin-json-editor"
                        onChange={(event) => setEditorValue(event.target.value)}
                        spellCheck={false}
                        value={editorValue}
                      />
                      </EditorSection>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {previewOpen && (
              <div
                aria-modal="true"
                className="admin-preview-modal-backdrop"
                onClick={() => setPreviewOpen(false)}
                role="dialog"
              >
                <div className="admin-preview-modal" onClick={(event) => event.stopPropagation()}>
                  <div className="admin-preview-modal-head">
                    <div>
                      <p className="card-kicker">Live preview</p>
                      <h3>Portfolio preview</h3>
                      <p>The popup reads directly from the current draft profile state.</p>
                    </div>

                    <div className="admin-preview-modal-actions">
                      <a className="ghost-button admin-preview-link" href="/" rel="noreferrer" target="_blank">
                        Open public page
                      </a>
                      <button className="ghost-button" onClick={() => setPreviewOpen(false)} type="button">
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="admin-preview-frame admin-preview-modal-frame">
                    <ProfileExperience
                      data={draftProfile}
                      preview
                      viewCount={analytics?.summary.totalViews ?? null}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
