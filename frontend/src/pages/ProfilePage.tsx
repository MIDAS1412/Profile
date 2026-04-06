import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPreviewCard } from '../components/MapPreviewCard'
import { SectionTitle } from '../components/SectionTitle'
import { Shell } from '../components/Shell'
import { useProfile } from '../hooks/useProfile'

const accentModes = [
  { key: 'ember', label: 'Ember' },
  { key: 'ocean', label: 'Ocean' },
  { key: 'forest', label: 'Forest' },
] as const

export function ProfilePage() {
  const { data, loading, error } = useProfile()
  const [accent, setAccent] = useState<(typeof accentModes)[number]['key']>('ember')
  const [copied, setCopied] = useState(false)
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false)

  const localTime = useMemo(() => {
    if (!data) {
      return ''
    }

    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      timeZone: data.identity.timezone,
    }).format(new Date())
  }, [data])

  const handleCopyEmail = async () => {
    if (!data) {
      return
    }

    try {
      await navigator.clipboard.writeText(data.identity.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Shell accent={accent}>
      <div className="page profile-page">
        <header className="topbar">
          <div>
            <p className="topbar-label">Profile Experience</p>
            <strong>{data?.identity.handle ?? 'Loading profile...'}</strong>
          </div>
          <nav className="topbar-nav">
            <a href="#overview">Overview</a>
            <a href="#journey">Journey</a>
            <a href="#work">Work</a>
            <Link to="/map">Map</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </header>

        {loading && (
          <section className="card loading-card">
            <p className="card-kicker">Booting profile</p>
            <h1>Loading your profile experience...</h1>
            <p>Fetching data from the backend before rendering the full layout.</p>
          </section>
        )}

        {error && !loading && (
          <section className="card error-card">
            <p className="card-kicker">API error</p>
            <h1>Could not load profile data.</h1>
            <p>{error}</p>
          </section>
        )}

        {data && !loading && !error && (
          <>
            <section className="reel-stage" id="overview">
              <div className="reel-caption">
                {data.coverHeadline.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <article className="showcase-browser">
                <div className="browser-bar">
                  <div className="browser-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="browser-address">midas-profile.vercel.app</div>
                </div>

                <div className="showcase-grid">
                  <div className="showcase-main">
                    <p className="card-kicker">Profile site</p>
                    <h1>{data.identity.name}</h1>
                    <p className="hero-role">{data.identity.role}</p>
                    <p className="hero-tagline">{data.identity.tagline}</p>
                    <p className="hero-bio">{data.identity.bio}</p>

                    <div className="hero-actions">
                      <a className="primary-button" href={`mailto:${data.identity.email}`}>
                        Contact now
                      </a>
                      <Link className="ghost-button" to="/map">
                        Open live map
                      </Link>
                      <button className="ghost-button" onClick={handleCopyEmail} type="button">
                        {copied ? 'Email copied' : 'Copy email'}
                      </button>
                    </div>

                    <div className="fact-pills">
                      {data.quickFacts.map((fact) => (
                        <span key={fact}>{fact}</span>
                      ))}
                    </div>
                  </div>

                  <aside className="showcase-side">
                    <div className="identity-card card">
                      <div className="identity-header">
                        <img alt={data.identity.handle} src={data.identity.avatarUrl} />
                        <div>
                          <p className="card-kicker">Handle</p>
                          <h2>{data.identity.handle}</h2>
                        </div>
                      </div>

                      <div className="identity-details">
                        <div>
                          <span>Timezone</span>
                          <strong>{data.identity.timezone}</strong>
                        </div>
                        <div>
                          <span>Local time</span>
                          <strong>{localTime}</strong>
                        </div>
                        <div>
                          <span>Availability</span>
                          <strong>{data.identity.availability}</strong>
                        </div>
                        <div>
                          <span>Location hint</span>
                          <strong>{data.identity.locationHint}</strong>
                        </div>
                      </div>

                      <div className="theme-switcher">
                        {accentModes.map((mode) => (
                          <button
                            className={mode.key === accent ? 'theme-chip active' : 'theme-chip'}
                            key={mode.key}
                            onClick={() => setAccent(mode.key)}
                            type="button"
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="showcase-metric-strip">
                      {data.metrics.slice(0, 2).map((metric) => (
                        <div className="showcase-metric" key={metric.label}>
                          <span>{metric.label}</span>
                          <strong>{metric.value}</strong>
                        </div>
                      ))}
                    </div>
                  </aside>
                </div>

                <div className="floating-note left">
                  <span>Now showing</span>
                  <strong>Profile + map + backend</strong>
                </div>
                <div className="floating-note right">
                  <span>Inspired by short-form reel layouts</span>
                  <strong>Top caption, centered screen, black stage</strong>
                </div>
              </article>
            </section>

            <section className="metric-grid">
              {data.metrics.map((metric) => (
                <article className="card metric-card" key={metric.label}>
                  <p className="card-kicker">{metric.label}</p>
                  <h2>{metric.value}</h2>
                  <p>{metric.detail}</p>
                </article>
              ))}
            </section>

            <section className="split-grid">
              <div className="card content-card">
                <SectionTitle
                  eyebrow="Focus"
                  title="What this profile highlights"
                  description="A mix of visual polish, practical backend structure, and profile data that can be edited from one source."
                />
                <div className="feature-grid">
                  {data.focusAreas.map((item) => (
                    <article className="feature-card" key={item.title}>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="side-stack">
                <button
                  className="spotlight-card"
                  onClick={() => setIsSpotlightOpen(true)}
                  type="button"
                >
                  <img alt={data.spotlight.alt} src={data.spotlight.imageUrl} />
                  <div className="spotlight-copy">
                    <p className="card-kicker">{data.spotlight.eyebrow}</p>
                    <h3>{data.spotlight.title}</h3>
                    <p>{data.spotlight.blurb}</p>
                    <span>Click image to open popup</span>
                  </div>
                </button>

                <MapPreviewCard />
              </div>
            </section>

            <section className="content-card card" id="journey">
              <SectionTitle
                eyebrow="Journey"
                title="Experience timeline"
                description="Structured like a living profile instead of a plain CV block."
              />
              <div className="timeline">
                {data.experience.map((item) => (
                  <article className="timeline-item" key={`${item.period}-${item.title}`}>
                    <span className="timeline-period">{item.period}</span>
                    <div className="timeline-body">
                      <h3>
                        {item.title} <small>@ {item.company}</small>
                      </h3>
                      <p>{item.summary}</p>
                      <ul>
                        {item.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="triple-grid">
              <article className="card content-card">
                <SectionTitle
                  eyebrow="Stack"
                  title="Core strengths"
                  description="Backend-driven content paired with a responsive frontend presentation."
                />
                <div className="skill-list">
                  {data.skills.map((skill) => (
                    <div className="skill-row" key={skill.name}>
                      <div className="skill-meta">
                        <strong>{skill.name}</strong>
                        <span>{skill.category}</span>
                      </div>
                      <div className="skill-bar">
                        <span style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card content-card">
                <SectionTitle
                  eyebrow="Principles"
                  title="How the work is shipped"
                  description="A concise set of rules that shape the profile and product experience."
                />
                <div className="principle-list">
                  {data.principles.map((principle) => (
                    <p key={principle}>{principle}</p>
                  ))}
                </div>
              </article>

              <article className="card content-card">
                <SectionTitle
                  eyebrow="Now"
                  title="Current momentum"
                  description="Short-form updates that make the profile feel alive."
                />
                <div className="now-list">
                  {data.now.map((item) => (
                    <div className="now-item" key={item}>
                      <span />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="content-card card" id="work">
              <SectionTitle
                eyebrow="Projects"
                title="Featured builds"
                description="Project cards ready for personal portfolio use. The data comes from the backend, so updates stay centralized."
              />
              <div className="project-grid">
                {data.projects.map((project) => (
                  <article className="project-card" key={project.title}>
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.blurb}</p>
                    </div>
                    <div className="stack-list">
                      {project.stack.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="project-links">
                      {project.links.github && (
                        <a href={project.links.github} rel="noreferrer" target="_blank">
                          GitHub
                        </a>
                      )}
                      {project.links.live && (
                        <a href={project.links.live} rel="noreferrer" target="_blank">
                          Live
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <footer className="footer-card card">
              <div>
                <p className="card-kicker">Links</p>
                <h2>Ready to turn this into your public profile hub.</h2>
              </div>
              <div className="footer-links">
                {data.socials.map((item) => (
                  <a href={item.href} key={item.label} rel="noreferrer" target="_blank">
                    {item.label}
                  </a>
                ))}
                <Link to="/map">Map page</Link>
                <Link to="/admin">Admin page</Link>
              </div>
            </footer>

            {isSpotlightOpen && (
              <div
                aria-modal="true"
                className="image-popup-backdrop"
                onClick={() => setIsSpotlightOpen(false)}
                role="dialog"
              >
                <div
                  className="image-popup-panel"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    aria-label="Close popup"
                    className="image-popup-close"
                    onClick={() => setIsSpotlightOpen(false)}
                    type="button"
                  >
                    Close
                  </button>
                  <div className="image-popup-grid">
                    <div className="image-popup-media">
                      <img alt={data.spotlight.alt} src={data.spotlight.imageUrl} />
                    </div>
                    <div className="image-popup-content">
                      <p className="card-kicker">{data.spotlight.eyebrow}</p>
                      <h2>{data.spotlight.modalTitle}</h2>
                      <p>{data.spotlight.modalDescription}</p>
                      <div className="image-popup-facts">
                        {data.spotlight.facts.map((fact) => (
                          <div className="image-popup-fact" key={`${fact.label}-${fact.value}`}>
                            <span>{fact.label}</span>
                            <strong>{fact.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
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
