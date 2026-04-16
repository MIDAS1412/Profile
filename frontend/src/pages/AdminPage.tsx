import { type FormEvent, useEffect, useState } from 'react'
import { Shell } from '../components/Shell'
import { buildApiUrl } from '../config/api'
import type { ProfileApiResponse, ProfileResponse } from '../types'

export const ADMIN_ROUTE = '/admin-midas-1420'

const ADMIN_TOKEN_STORAGE_KEY = 'midas-profile-admin-token'

type StatusMessage = {
  tone: 'success' | 'error'
  message: string
}

type AdminSessionResponse = {
  ok: true
  email: string
  expiresAt: string
}

type AdminLoginResponse = AdminSessionResponse & {
  token: string
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
  const [busy, setBusy] = useState<'idle' | 'login' | 'logout' | 'reset' | 'save'>('idle')
  const [editorValue, setEditorValue] = useState('')
  const [sessionInfo, setSessionInfo] = useState<AdminSessionResponse | null>(null)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    let cancelled = false

    if (!token) {
      setAuthState('logged-out')
      setSessionInfo(null)
      setEditorValue('')
      return () => {
        cancelled = true
      }
    }

    async function bootstrap() {
      setAuthState('checking')
      setAuthMessage(null)

      try {
        const session = await requestJson<AdminSessionResponse>('/admin/session', {}, token ?? undefined)
        const currentProfile = await requestJson<ProfileApiResponse>(
          '/admin/profile',
          {},
          token ?? undefined,
        )

        if (cancelled) {
          return
        }

        setSessionInfo(session)
        setEditorValue(JSON.stringify(stripProfileMeta(currentProfile), null, 2))
        setAuthState('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        persistToken(null)
        setToken(null)
        setSessionInfo(null)
        setAuthState('logged-out')
        setAuthMessage(error instanceof Error ? error.message : 'Admin session expired.')
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [token])

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
        message: 'Dang nhap thanh cong. Dang tai du lieu quan tri...',
      })
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Dang nhap that bai.')
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
      setBusy('idle')
      setAuthMessage(null)
    }
  }

  async function handleSave() {
    if (!token) {
      return
    }

    setBusy('save')
    setStatus(null)

    try {
      const parsedProfile = JSON.parse(editorValue) as ProfileResponse
      const savedProfile = await requestJson<ProfileApiResponse>(
        '/admin/profile',
        {
          body: JSON.stringify(parsedProfile),
          method: 'PUT',
        },
        token,
      )

      setEditorValue(JSON.stringify(stripProfileMeta(savedProfile), null, 2))
      setStatus({
        tone: 'success',
        message: 'Da luu thay doi vao backend profile store.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Khong the luu thay doi.',
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

      setEditorValue(JSON.stringify(stripProfileMeta(resetValue), null, 2))
      setStatus({
        tone: 'success',
        message: 'Da reset profile ve du lieu mac dinh.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Khong the reset du lieu.',
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
        message: 'JSON da duoc format lai.',
      })
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'JSON khong hop le.',
      })
    }
  }

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
            <p>Validating the current token and loading the editable profile payload.</p>
          </section>
        )}

        {authState === 'logged-out' && (
          <section className="panel admin-login-card">
            <p className="card-kicker">Restricted access</p>
            <h1>Sign in to open the profile admin.</h1>
            <p className="admin-copy">
              Only the configured admin account can open this page. Public visitors can still read the
              profile, but they cannot change the data source.
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

        {authState === 'ready' && (
          <>
            <section className="panel admin-hero-panel">
              <div>
                <p className="card-kicker">Editor</p>
                <h1>Edit the full profile payload from one protected page.</h1>
                <p className="admin-copy">
                  Every field shown on the public profile is stored in this JSON. Edit the payload,
                  format it, then save it back through the protected backend endpoint.
                </p>
              </div>

              <div className="admin-hero-actions">
                <button className="primary-button" disabled={busy === 'save'} onClick={handleSave} type="button">
                  {busy === 'save' ? 'Saving...' : 'Save changes'}
                </button>
                <button className="ghost-button" disabled={busy === 'reset'} onClick={handleReset} type="button">
                  {busy === 'reset' ? 'Resetting...' : 'Reset to default'}
                </button>
                <button className="ghost-button" onClick={handleFormatJson} type="button">
                  Format JSON
                </button>
              </div>

              <div className="admin-session-strip">
                <span>Signed in as {sessionInfo?.email ?? 'admin'}</span>
                {sessionInfo?.expiresAt && <span>Session expires {new Date(sessionInfo.expiresAt).toLocaleString()}</span>}
              </div>

              {status && <p className={`admin-status admin-status-${status.tone}`}>{status.message}</p>}
            </section>

            <section className="panel admin-editor-panel">
              <div className="admin-section-head">
                <div>
                  <p className="card-kicker">Profile JSON</p>
                  <h2>Protected payload editor</h2>
                  <p>
                    Keep the same overall shape when you edit. The backend validates the payload before
                    saving it.
                  </p>
                </div>
              </div>

              <textarea
                className="admin-json-editor"
                onChange={(event) => setEditorValue(event.target.value)}
                spellCheck={false}
                value={editorValue}
              />
            </section>
          </>
        )}
      </div>
    </Shell>
  )
}
