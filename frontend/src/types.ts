export type ProfileMetric = {
  label: string
  value: string
  detail: string
}

export type FocusArea = {
  title: string
  description: string
}

export type SkillItem = {
  name: string
  level: number
  category: string
}

export type ExperienceItem = {
  period: string
  title: string
  company: string
  summary: string
  highlights: string[]
}

export type ProjectItem = {
  title: string
  blurb: string
  stack: string[]
  links: {
    live?: string
    github?: string
  }
}

export type SocialItem = {
  label: string
  href: string
}

export type ProfileResponse = {
  coverHeadline: string[]
  identity: {
    name: string
    handle: string
    role: string
    tagline: string
    bio: string
    email: string
    timezone: string
    availability: string
    avatarUrl: string
    locationHint: string
  }
  quickFacts: string[]
  metrics: ProfileMetric[]
  focusAreas: FocusArea[]
  skills: SkillItem[]
  experience: ExperienceItem[]
  projects: ProjectItem[]
  socials: SocialItem[]
  principles: string[]
  now: string[]
}
