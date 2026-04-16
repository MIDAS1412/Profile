import type {
  ExperienceItem,
  FocusArea,
  GalleryImage,
  ProfileMetric,
  ProfileResponse,
  ProjectItem,
  SavedLocation,
  SkillItem,
  SocialItem,
} from '../../../shared/profile.js'

type UnknownRecord = Record<string, unknown>

function readRecord(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }

  return value as UnknownRecord
}

function readString(value: unknown, label: string) {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string.`)
  }

  return value
}

function readNumber(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`)
  }

  return value
}

function readArray(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`)
  }

  return value
}

function readStringArray(value: unknown, label: string) {
  return readArray(value, label).map((item, index) => readString(item, `${label}[${index}]`))
}

function parseMetric(value: unknown, index: number): ProfileMetric {
  const metric = readRecord(value, `metrics[${index}]`)

  return {
    label: readString(metric.label, `metrics[${index}].label`),
    value: readString(metric.value, `metrics[${index}].value`),
    detail: readString(metric.detail, `metrics[${index}].detail`),
  }
}

function parseFocusArea(value: unknown, index: number): FocusArea {
  const focusArea = readRecord(value, `focusAreas[${index}]`)

  return {
    title: readString(focusArea.title, `focusAreas[${index}].title`),
    description: readString(focusArea.description, `focusAreas[${index}].description`),
  }
}

function parseSkill(value: unknown, index: number): SkillItem {
  const skill = readRecord(value, `skills[${index}]`)

  return {
    name: readString(skill.name, `skills[${index}].name`),
    level: readNumber(skill.level, `skills[${index}].level`),
    category: readString(skill.category, `skills[${index}].category`),
  }
}

function parseExperience(value: unknown, index: number): ExperienceItem {
  const experience = readRecord(value, `experience[${index}]`)

  return {
    period: readString(experience.period, `experience[${index}].period`),
    title: readString(experience.title, `experience[${index}].title`),
    company: readString(experience.company, `experience[${index}].company`),
    summary: readString(experience.summary, `experience[${index}].summary`),
    highlights: readStringArray(experience.highlights, `experience[${index}].highlights`),
  }
}

function parseProject(value: unknown, index: number): ProjectItem {
  const project = readRecord(value, `projects[${index}]`)
  const links = readRecord(project.links, `projects[${index}].links`)

  return {
    title: readString(project.title, `projects[${index}].title`),
    blurb: readString(project.blurb, `projects[${index}].blurb`),
    stack: readStringArray(project.stack, `projects[${index}].stack`),
    links: {
      live: typeof links.live === 'string' ? links.live : undefined,
      github: typeof links.github === 'string' ? links.github : undefined,
    },
  }
}

function parseSocial(value: unknown, index: number): SocialItem {
  const social = readRecord(value, `socials[${index}]`)

  return {
    label: readString(social.label, `socials[${index}].label`),
    href: readString(social.href, `socials[${index}].href`),
  }
}

function parseGalleryImage(value: unknown, index: number): GalleryImage {
  const galleryImage = readRecord(value, `gallery[${index}]`)

  return {
    label: readString(galleryImage.label, `gallery[${index}].label`),
    title: readString(galleryImage.title, `gallery[${index}].title`),
    description: readString(galleryImage.description, `gallery[${index}].description`),
    imageUrl: readString(galleryImage.imageUrl, `gallery[${index}].imageUrl`),
    alt: readString(galleryImage.alt, `gallery[${index}].alt`),
    replacementHint: readString(galleryImage.replacementHint, `gallery[${index}].replacementHint`),
  }
}

function parseLocation(value: unknown): SavedLocation {
  const location = readRecord(value, 'location')

  return {
    label: readString(location.label, 'location.label'),
    description: readString(location.description, 'location.description'),
    latitude: readNumber(location.latitude, 'location.latitude'),
    longitude: readNumber(location.longitude, 'location.longitude'),
  }
}

export function parseProfileInput(value: unknown): ProfileResponse {
  const profile = readRecord(value, 'profile')
  const identity = readRecord(profile.identity, 'identity')

  return {
    coverHeadline: readStringArray(profile.coverHeadline, 'coverHeadline'),
    identity: {
      name: readString(identity.name, 'identity.name'),
      initials: readString(identity.initials, 'identity.initials'),
      handle: readString(identity.handle, 'identity.handle'),
      role: readString(identity.role, 'identity.role'),
      tagline: readString(identity.tagline, 'identity.tagline'),
      bio: readString(identity.bio, 'identity.bio'),
      email: readString(identity.email, 'identity.email'),
      timezone: readString(identity.timezone, 'identity.timezone'),
      availability: readString(identity.availability, 'identity.availability'),
      locationHint: readString(identity.locationHint, 'identity.locationHint'),
    },
    location: parseLocation(profile.location),
    gallery: readArray(profile.gallery, 'gallery').map((item, index) => parseGalleryImage(item, index)),
    quickFacts: readStringArray(profile.quickFacts, 'quickFacts'),
    metrics: readArray(profile.metrics, 'metrics').map((item, index) => parseMetric(item, index)),
    focusAreas: readArray(profile.focusAreas, 'focusAreas').map((item, index) => parseFocusArea(item, index)),
    skills: readArray(profile.skills, 'skills').map((item, index) => parseSkill(item, index)),
    experience: readArray(profile.experience, 'experience').map((item, index) => parseExperience(item, index)),
    projects: readArray(profile.projects, 'projects').map((item, index) => parseProject(item, index)),
    socials: readArray(profile.socials, 'socials').map((item, index) => parseSocial(item, index)),
    principles: readStringArray(profile.principles, 'principles'),
    now: readStringArray(profile.now, 'now'),
  }
}
