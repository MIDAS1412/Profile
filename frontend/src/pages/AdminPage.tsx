import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell } from '../components/Shell'
import { clearStoredProfile, saveStoredProfile } from '../lib/profileDraft'
import { useProfile } from '../hooks/useProfile'
import type { ProfileResponse, SpotlightFact } from '../types'

function toLines(items: string[]) {
  return items.join('\n')
}

function fromLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function factsToLines(items: SpotlightFact[]) {
  return items.map((item) => `${item.label}: ${item.value}`).join('\n')
}

function factsFromLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, ...rest] = item.split(':')

      return {
        label: label.trim(),
        value: rest.join(':').trim(),
      }
    })
    .filter((item) => item.label && item.value)
}

export function AdminPage() {
  const { data, baseData, loading, error, hasLocalOverride } = useProfile()
  const [form, setForm] = useState<ProfileResponse | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (data) {
      setForm(data)
    }
  }, [data])

  const updateForm = (updater: (current: ProfileResponse) => ProfileResponse) => {
    setForm((current) => (current ? updater(current) : current))
  }

  const saveChanges = () => {
    if (!form) {
      return
    }

    saveStoredProfile(form)
    setStatus('Saved to this browser. Profile and map pages now use the updated draft.')
  }

  const resetChanges = () => {
    if (!baseData) {
      return
    }

    clearStoredProfile()
    setForm(baseData)
    setStatus('Reset to API defaults.')
  }

  const copyJson = async () => {
    if (!form) {
      return
    }

    await navigator.clipboard.writeText(JSON.stringify(form, null, 2))
    setStatus('Current admin draft copied as JSON.')
  }

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus('This browser does not support geolocation.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateForm((current) => ({
          ...current,
          location: {
            ...current.location,
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
          },
        }))
        setLocating(false)
        setStatus('Filled the location fields with your current device coordinates.')
      },
      (geoError) => {
        setLocating(false)
        setStatus(geoError.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    )
  }

  return (
    <Shell accent="forest">
      <div className="page admin-page">
        <header className="topbar">
          <div>
            <p className="topbar-label">Admin</p>
            <strong>Profile content editor</strong>
          </div>
          <nav className="topbar-nav">
            <Link to="/">Profile</Link>
            <Link to="/map">Map</Link>
          </nav>
        </header>

        {loading && (
          <section className="card loading-card">
            <p className="card-kicker">Loading admin</p>
            <h1>Preparing your profile editor...</h1>
          </section>
        )}

        {error && !loading && (
          <section className="card error-card">
            <p className="card-kicker">API error</p>
            <h1>Could not load profile data.</h1>
            <p>{error}</p>
          </section>
        )}

        {form && !loading && !error && (
          <>
            <section className="admin-hero card">
              <div>
                <p className="card-kicker">Editor status</p>
                <h1>One place to edit text, image popup, and saved location.</h1>
                <p className="hero-bio">
                  This admin page stores your draft in the current browser, so you can
                  tweak the public profile without touching code every time.
                </p>
              </div>

              <div className="admin-badges">
                <span>{hasLocalOverride ? 'Using local draft' : 'Using API defaults'}</span>
                <span>Saved in this browser only</span>
              </div>

              <div className="hero-actions">
                <button className="primary-button" onClick={saveChanges} type="button">
                  Save changes
                </button>
                <button className="ghost-button" onClick={resetChanges} type="button">
                  Reset to default
                </button>
                <button className="ghost-button" onClick={copyJson} type="button">
                  Copy JSON
                </button>
              </div>

              {status && <p className="admin-status">{status}</p>}
            </section>

            <section className="admin-grid">
              <article className="card admin-card">
                <p className="card-kicker">Main profile</p>
                <div className="admin-fields">
                  <label>
                    Cover headline
                    <textarea
                      rows={4}
                      value={toLines(form.coverHeadline)}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          coverHeadline: fromLines(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Name
                    <input
                      value={form.identity.name}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, name: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Handle
                    <input
                      value={form.identity.handle}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, handle: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Role
                    <input
                      value={form.identity.role}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, role: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Tagline
                    <textarea
                      rows={3}
                      value={form.identity.tagline}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, tagline: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Bio
                    <textarea
                      rows={5}
                      value={form.identity.bio}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, bio: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      value={form.identity.email}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, email: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Availability
                    <input
                      value={form.identity.availability}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, availability: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Avatar URL
                    <input
                      value={form.identity.avatarUrl}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          identity: { ...current.identity, avatarUrl: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Quick facts
                    <textarea
                      rows={4}
                      value={toLines(form.quickFacts)}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          quickFacts: fromLines(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Current updates
                    <textarea
                      rows={4}
                      value={toLines(form.now)}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          now: fromLines(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>
              </article>

              <article className="card admin-card">
                <p className="card-kicker">Saved location</p>
                <div className="admin-fields">
                  <label>
                    Location label
                    <input
                      value={form.location.label}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          location: { ...current.location, label: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Location description
                    <textarea
                      rows={3}
                      value={form.location.description}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          location: { ...current.location, description: event.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Latitude
                    <input
                      type="number"
                      step="0.000001"
                      value={form.location.latitude}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          location: {
                            ...current.location,
                            latitude: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    Longitude
                    <input
                      type="number"
                      step="0.000001"
                      value={form.location.longitude}
                      onChange={(event) =>
                        updateForm((current) => ({
                          ...current,
                          location: {
                            ...current.location,
                            longitude: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="hero-actions">
                  <button className="ghost-button" onClick={fillCurrentLocation} type="button">
                    {locating ? 'Reading current location...' : 'Use current device location'}
                  </button>
                </div>
              </article>

              <article className="card admin-card admin-card-wide">
                <p className="card-kicker">Popup image</p>
                <div className="admin-media-grid">
                  <div className="admin-media-preview">
                    <img alt={form.spotlight.alt} src={form.spotlight.imageUrl} />
                  </div>

                  <div className="admin-fields">
                    <label>
                      Image URL
                      <input
                        value={form.spotlight.imageUrl}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: { ...current.spotlight, imageUrl: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Image alt
                      <input
                        value={form.spotlight.alt}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: { ...current.spotlight, alt: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Card eyebrow
                      <input
                        value={form.spotlight.eyebrow}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: { ...current.spotlight, eyebrow: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Card title
                      <input
                        value={form.spotlight.title}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: { ...current.spotlight, title: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Card blurb
                      <textarea
                        rows={3}
                        value={form.spotlight.blurb}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: { ...current.spotlight, blurb: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Popup title
                      <input
                        value={form.spotlight.modalTitle}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: { ...current.spotlight, modalTitle: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Popup description
                      <textarea
                        rows={4}
                        value={form.spotlight.modalDescription}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: {
                              ...current.spotlight,
                              modalDescription: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label>
                      Popup facts
                      <textarea
                        rows={5}
                        value={factsToLines(form.spotlight.facts)}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            spotlight: {
                              ...current.spotlight,
                              facts: factsFromLines(event.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </Shell>
  )
}
