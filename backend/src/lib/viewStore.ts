import fs from 'node:fs/promises'
import path from 'node:path'
import type {
  ProfileAnalytics,
  ProfileAnalyticsBucket,
  ProfileViewStats,
  ProfileVisitEntry,
  ProfileVisitLocation,
} from '../../../shared/profile.js'
import { getMongoAvailability, getMongoDb } from './mongo.js'

type StoredProfileViewStore = ProfileViewStats & {
  recentVisits: ProfileVisitEntry[]
}

type StoredProfileViewDocument = StoredProfileViewStore & {
  _id?: string
}

const collectionName = 'profile_stats'
const documentId = 'profile-views'

function readVisitLogLimit() {
  const rawLimit = Number(process.env.PROFILE_VISIT_LOG_LIMIT ?? 250)

  if (!Number.isFinite(rawLimit)) {
    return 250
  }

  return Math.min(Math.max(Math.floor(rawLimit), 25), 1000)
}

const visitLogLimit = readVisitLogLimit()

function getViewStorePath() {
  const configuredProfileStorePath = process.env.PROFILE_STORE_PATH?.trim()

  if (configuredProfileStorePath) {
    const resolvedProfileStorePath = path.resolve(process.cwd(), configuredProfileStorePath)
    return path.join(path.dirname(resolvedProfileStorePath), 'profile-views.json')
  }

  return path.resolve(process.cwd(), 'data', 'profile-views.json')
}

function normalizeViewCount(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 0
  }

  return Math.floor(value)
}

function normalizeTimestamp(value: unknown, fallback = new Date().toISOString()) {
  return typeof value === 'string' && value ? value : fallback
}

function normalizeVisitLocation(value: unknown): ProfileVisitLocation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      country: null,
      countryCode: null,
      region: null,
      city: null,
      source: 'unknown',
    }
  }

  const record = value as Record<string, unknown>
  const source = record.source

  return {
    country: typeof record.country === 'string' && record.country ? record.country : null,
    countryCode: typeof record.countryCode === 'string' && record.countryCode ? record.countryCode : null,
    region: typeof record.region === 'string' && record.region ? record.region : null,
    city: typeof record.city === 'string' && record.city ? record.city : null,
    source:
      source === 'edge-header' || source === 'geoip' || source === 'unknown'
        ? source
        : 'unknown',
  }
}

function normalizeVisitEntry(value: unknown): ProfileVisitEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const id = typeof record.id === 'string' && record.id ? record.id : null
  const viewedAt = normalizeTimestamp(record.viewedAt)

  if (!id) {
    return null
  }

  return {
    id,
    viewedAt,
    ip: typeof record.ip === 'string' && record.ip ? record.ip : 'Unknown',
    path: typeof record.path === 'string' && record.path ? record.path : '/',
    referrer: typeof record.referrer === 'string' && record.referrer ? record.referrer : null,
    source: typeof record.source === 'string' && record.source ? record.source : 'Direct',
    userAgent: typeof record.userAgent === 'string' ? record.userAgent : '',
    browser: typeof record.browser === 'string' && record.browser ? record.browser : 'Unknown browser',
    os: typeof record.os === 'string' && record.os ? record.os : 'Unknown OS',
    deviceType: typeof record.deviceType === 'string' && record.deviceType ? record.deviceType : 'desktop',
    deviceLabel: typeof record.deviceLabel === 'string' && record.deviceLabel ? record.deviceLabel : 'Desktop',
    location: normalizeVisitLocation(record.location),
  }
}

function createViewStore(count = 0): StoredProfileViewStore {
  return {
    count,
    updatedAt: new Date().toISOString(),
    recentVisits: [],
  }
}

function readViewStore(value: unknown): StoredProfileViewStore {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createViewStore()
  }

  const record = value as Record<string, unknown>
  const recentVisits = Array.isArray(record.recentVisits)
    ? record.recentVisits
        .map((entry) => normalizeVisitEntry(entry))
        .filter((entry): entry is ProfileVisitEntry => entry !== null)
        .slice(0, visitLogLimit)
    : []

  return {
    count: normalizeViewCount(record.count),
    updatedAt: normalizeTimestamp(record.updatedAt),
    recentVisits,
  }
}

function createBucketSummary(
  entries: ProfileVisitEntry[],
  selector: (entry: ProfileVisitEntry) => string,
): ProfileAnalyticsBucket[] {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    const label = selector(entry).trim() || 'Unknown'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([label, count]) => ({
      label,
      count,
    }))
}

function buildAnalytics(store: StoredProfileViewStore): ProfileAnalytics {
  const now = Date.now()
  const recentVisits = store.recentVisits
  const uniqueVisitors = new Set(recentVisits.map((entry) => entry.ip)).size
  const viewsLast24Hours = recentVisits.filter((entry) => {
    const viewedAt = Date.parse(entry.viewedAt)
    return Number.isFinite(viewedAt) && now - viewedAt <= 24 * 60 * 60 * 1000
  }).length

  return {
    count: store.count,
    updatedAt: store.updatedAt,
    recentVisits,
    summary: {
      totalViews: store.count,
      trackedVisits: recentVisits.length,
      uniqueVisitors,
      viewsLast24Hours,
      lastViewedAt: recentVisits[0]?.viewedAt ?? (store.count > 0 ? store.updatedAt : null),
      storageLimit: visitLogLimit,
      topSources: createBucketSummary(recentVisits, (entry) => entry.source),
      topCountries: createBucketSummary(
        recentVisits,
        (entry) => entry.location.country ?? entry.location.countryCode ?? 'Unknown',
      ),
    },
  }
}

function withVisit(store: StoredProfileViewStore, visit: ProfileVisitEntry): StoredProfileViewStore {
  return {
    count: store.count + 1,
    updatedAt: visit.viewedAt,
    recentVisits: [visit, ...store.recentVisits].slice(0, visitLogLimit),
  }
}

async function writeViewStoreToFile(store: StoredProfileViewStore) {
  const storePath = getViewStorePath()

  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')

  return store
}

async function loadViewStoreFromFile() {
  try {
    const rawValue = await fs.readFile(getViewStorePath(), 'utf8')
    return readViewStore(JSON.parse(rawValue))
  } catch {
    const seededStore = createViewStore()

    try {
      await writeViewStoreToFile(seededStore)
    } catch {
      return seededStore
    }

    return seededStore
  }
}

async function incrementViewStoreInFile(visit: ProfileVisitEntry) {
  const nextStore = withVisit(await loadViewStoreFromFile(), visit)
  await writeViewStoreToFile(nextStore)
  return nextStore
}

async function loadViewStoreFromMongo() {
  const db = await getMongoDb()
  const collection = db.collection<StoredProfileViewDocument & { _id: string }>(collectionName)
  const existing = await collection.findOne({ _id: documentId })

  if (existing) {
    return readViewStore(existing)
  }

  const seededStore = createViewStore()

  await collection.updateOne(
    { _id: documentId },
    {
      $set: seededStore,
    },
    { upsert: true },
  )

  return seededStore
}

async function incrementViewStoreInMongo(visit: ProfileVisitEntry) {
  const db = await getMongoDb()
  const collection = db.collection<StoredProfileViewDocument & { _id: string }>(collectionName)

  await collection.updateOne(
    { _id: documentId },
    {
      $inc: {
        count: 1,
      },
      $set: {
        updatedAt: visit.viewedAt,
      },
      $push: {
        recentVisits: {
          $each: [visit],
          $position: 0,
          $slice: visitLogLimit,
        },
      },
    },
    { upsert: true },
  )

  const existing = await collection.findOne({ _id: documentId })

  if (!existing) {
    return withVisit(createViewStore(), visit)
  }

  return readViewStore(existing)
}

async function loadStoredProfileViews() {
  if (!getMongoAvailability().enabled) {
    return loadViewStoreFromFile()
  }

  try {
    return await loadViewStoreFromMongo()
  } catch (error) {
    console.warn('MongoDB view read failed, falling back to file view store.', error)
    return loadViewStoreFromFile()
  }
}

export async function loadProfileViews() {
  const store = await loadStoredProfileViews()

  return {
    count: store.count,
    updatedAt: store.updatedAt,
  }
}

export async function loadProfileAnalytics() {
  return buildAnalytics(await loadStoredProfileViews())
}

export async function incrementProfileViews(visit: ProfileVisitEntry) {
  if (getMongoAvailability().enabled) {
    try {
      const store = await incrementViewStoreInMongo(visit)

      return {
        count: store.count,
        updatedAt: store.updatedAt,
      }
    } catch (error) {
      console.warn('MongoDB view increment failed, falling back to file view store.', error)
    }
  }

  const store = await incrementViewStoreInFile(visit)

  return {
    count: store.count,
    updatedAt: store.updatedAt,
  }
}
