import { useMemo, useState } from 'react'
import { SectionTitle } from '../components/SectionTitle'
import { Shell } from '../components/Shell'
import { useProfile } from '../hooks/useProfile'
import { useProfileViews } from '../hooks/useProfileViews'

const navItems = [
  { label: 'HOME', href: '#home' },
  { label: 'ABOUT', href: '#about' },
  { label: 'SERVICE', href: '#service' },
  { label: 'PROJECT', href: '#project' },
  { label: 'SKILL', href: '#skill' },
  { label: 'CONTACT', href: '#contact' },
]

export function ProfilePage() {
  const { data, loading, error } = useProfile()
  const { count: viewCount, loading: viewCountLoading } = useProfileViews()
  const [copied, setCopied] = useState(false)

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

  const firstName = useMemo(() => {
    if (!data) {
      return 'Dung'
    }

    const segments = data.identity.name.trim().split(/\s+/)
    return segments.at(-1) ?? data.identity.name
  }, [data])

  const heroStats = useMemo(() => {
    if (!data) {
      return []
    }

    return [
      {
        value: `${String(data.projects.length).padStart(2, '0')}+`,
        label: 'Project Builds',
      },
      {
        value: `${String(data.skills.length).padStart(2, '0')}+`,
        label: 'Core Skills',
      },
      {
        value: `${String(data.experience.length).padStart(2, '0')}+`,
        label: 'Career Chapters',
      },
    ]
  }, [data])

  const primaryProjectLink = data?.projects.find((project) => project.links.github || project.links.live)
  const heroImage = data?.gallery[0]
  const secondaryImage = data?.gallery[1] ?? data?.gallery[0]
  const formattedViewCount = useMemo(() => {
    if (viewCount === null) {
      return ''
    }

    return new Intl.NumberFormat('vi-VN').format(viewCount)
  }, [viewCount])

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
    <Shell accent="ember">
      <div className="page profile-page cyber-page">
        {(viewCountLoading || viewCount !== null) && (
          <aside
            aria-label={viewCount !== null ? `${formattedViewCount} luot xem` : 'Dang tai luot xem'}
            className="view-counter-badge"
          >
            <span aria-hidden="true" className="view-counter-icon">
              <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
                <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </span>
            <span className="view-counter-value">{viewCount !== null ? formattedViewCount : '...'}</span>
          </aside>
        )}

        <header className="cyber-topbar">
          <a className="brand-mark" href="#home">
            {firstName}.
          </a>

          <nav className="cyber-nav">
            {navItems.map((item) => (
              <a href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          {data && (
            <a className="topbar-cta" href={`mailto:${data.identity.email}`}>
              HIRE ME
            </a>
          )}
        </header>

        {loading && (
          <section className="panel loading-card">
            <p className="card-kicker">Booting profile</p>
            <h1>Loading your profile experience...</h1>
            <p>Fetching the profile payload from the API before rendering the full layout.</p>
          </section>
        )}

        {error && !loading && (
          <section className="panel error-card">
            <p className="card-kicker">Profile error</p>
            <h1>Could not load profile data.</h1>
            <p>{error}</p>
          </section>
        )}

        {data && !loading && !error && (
          <>
            <section className="hero-grid section-anchor" id="home">
              <article className="hero-copy">
                <p className="welcome-copy">Welcome</p>
                <h1 className="hero-title">
                  Hello Everyone I&apos;m <span>{firstName}</span>
                </h1>
                <p className="hero-role-line">{data.identity.role}</p>
                <p className="hero-summary">{data.identity.tagline}</p>
                <p className="hero-bio">{data.identity.bio}</p>

                <div className="hero-actions">
                  <a className="primary-button" href={`mailto:${data.identity.email}`}>
                    Contact Me
                  </a>

                  {primaryProjectLink && (primaryProjectLink.links.github || primaryProjectLink.links.live) && (
                    <a
                      className="ghost-button"
                      href={primaryProjectLink.links.github ?? primaryProjectLink.links.live}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View Work
                    </a>
                  )}

                  <button className="ghost-button" onClick={handleCopyEmail} type="button">
                    {copied ? 'Email Copied' : 'Copy Email'}
                  </button>
                </div>

                <div className="hero-stat-grid">
                  {heroStats.map((item) => (
                    <article className="stat-tile" key={item.label}>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </article>
                  ))}
                </div>

                <div className="social-strip">
                  {data.socials.map((item) => (
                    <a href={item.href} key={item.label} rel="noreferrer" target="_blank">
                      {item.label}
                    </a>
                  ))}
                </div>
              </article>

              <article className="hero-visual">
                <div className="visual-badge visual-badge-top">Responsive</div>
                <div className="visual-badge visual-badge-bottom">Railway API</div>
                <div className="visual-badge visual-badge-side">Vercel Frontend</div>
                <div className="visual-orbit" />

                <div className="device-frame">
                  <div className="device-shell">
                    <div className="device-notch" />
                    {heroImage && <img alt={heroImage.alt} className="device-image" src={heroImage.imageUrl} />}
                    <div className="device-footer">
                      <span>{data.identity.handle}</span>
                      <strong>{data.identity.role}</strong>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            <section className="about-grid section-anchor" id="about">
              <article className="panel about-panel">
                <SectionTitle
                  eyebrow="About"
                  title={data.identity.name}
                  description="A darker, sharper landing page inspired by portfolio hero layouts, while still staying connected to the shared backend contract."
                />

                <div className="info-grid">
                  <div className="info-card">
                    <span>Timezone</span>
                    <strong>{data.identity.timezone}</strong>
                  </div>
                  <div className="info-card">
                    <span>Local Time</span>
                    <strong>{localTime}</strong>
                  </div>
                  <div className="info-card">
                    <span>Availability</span>
                    <strong>{data.identity.availability}</strong>
                  </div>
                  <div className="info-card">
                    <span>Location</span>
                    <strong>{data.location.label}</strong>
                  </div>
                </div>

                <div className="headline-strip">
                  {data.coverHeadline.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </article>

              <article className="panel portrait-panel">
                {secondaryImage && <img alt={secondaryImage.alt} src={secondaryImage.imageUrl} />}
                <div className="portrait-copy">
                  <p className="card-kicker">Profile visual</p>
                  <h3>{secondaryImage?.title ?? data.identity.role}</h3>
                  <p>{secondaryImage?.description ?? data.location.description}</p>
                </div>
              </article>
            </section>

            <section className="panel service-panel section-anchor" id="service">
              <SectionTitle
                eyebrow="Service"
                title="Focused on clean UI, practical systems, and deploy safety"
                description="The visual direction follows the dark portfolio reference, while each card still reflects the actual profile data and deployment setup."
              />

              <div className="focus-grid">
                {data.focusAreas.map((item) => (
                  <article className="focus-card" key={item.title}>
                    <p className="card-kicker">Focus</p>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="project-section section-anchor" id="project">
              <div className="section-title">
                <span>Project</span>
                <h2>Selected builds from the current stack</h2>
                <p>Projects stay data-driven, but the presentation is now shaped like a cinematic landing page instead of a neutral dashboard.</p>
              </div>

              <div className="project-grid">
                {data.projects.map((project) => (
                  <article className="project-card" key={project.title}>
                    <div className="project-header">
                      <p className="card-kicker">Case study</p>
                      <h3>{project.title}</h3>
                    </div>
                    <p>{project.blurb}</p>
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

            <section className="skill-layout section-anchor" id="skill">
              <article className="panel skill-panel">
                <SectionTitle
                  eyebrow="Skill"
                  title="Core stack"
                  description="High-confidence tools and disciplines used to build, ship, and keep the profile maintainable."
                />

                <div className="skill-list">
                  {data.skills.map((skill) => (
                    <div className="skill-row" key={skill.name}>
                      <div className="skill-meta">
                        <strong>{skill.name}</strong>
                        <span>
                          {skill.category} / {skill.level}%
                        </span>
                      </div>
                      <div className="skill-bar">
                        <span style={{ width: `${skill.level}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel timeline-panel">
                <SectionTitle
                  eyebrow="Journey"
                  title="Current direction"
                  description="A compact timeline that keeps the homepage feeling like a portfolio instead of a document dump."
                />

                <div className="timeline-list">
                  {data.experience.map((item) => (
                    <article className="timeline-card" key={`${item.period}-${item.title}`}>
                      <span>{item.period}</span>
                      <h3>{item.title}</h3>
                      <strong>{item.company}</strong>
                      <p>{item.summary}</p>
                    </article>
                  ))}
                </div>
              </article>
            </section>

            <footer className="panel contact-panel section-anchor" id="contact">
              <div className="contact-copy">
                <p className="card-kicker">Contact</p>
                <h2>Ready to ship a darker, sharper portfolio presence.</h2>
                <p>
                  Frontend deploys on Vercel, profile data can come from Railway, and the page still renders safely if the API is not available.
                </p>
              </div>

              <div className="contact-actions">
                <a className="primary-button" href={`mailto:${data.identity.email}`}>
                  {data.identity.email}
                </a>
                <div className="contact-pills">
                  {data.principles.map((principle) => (
                    <span key={principle}>{principle}</span>
                  ))}
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </Shell>
  )
}
