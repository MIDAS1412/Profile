import fs from 'node:fs/promises'
import path from 'node:path'
import type { ProfileViewStats } from '../../../shared/profile.js'
import { getMongoAvailability, getMongoDb } from './mongo.js'

type StoredProfileViewDocument = ProfileViewStats & {
  _id?: string
}

const collectionName = 'profile_stats'
const documentId = 'profile-views'

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

function createViewStats(count = 0): ProfileViewStats {
  return {
    count,
    updatedAt: new Date().toISOString(),
  }
}

function readViewStats(value: unknown): ProfileViewStats {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createViewStats()
  }

  const record = value as Record<string, unknown>
  const normalizedCount = normalizeViewCount(record.count)

  return {
    count: normalizedCount,
    updatedAt: typeof record.updatedAt === 'string' && record.updatedAt ? record.updatedAt : new Date().toISOString(),
  }
}

async function writeViewStatsToFile(stats: ProfileViewStats) {
  const storePath = getViewStorePath()

  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, `${JSON.stringify(stats, null, 2)}\n`, 'utf8')

  return stats
}

async function loadProfileViewsFromFile() {
  try {
    const rawValue = await fs.readFile(getViewStorePath(), 'utf8')
    return readViewStats(JSON.parse(rawValue))
  } catch {
    const seededStats = createViewStats()

    try {
      await writeViewStatsToFile(seededStats)
    } catch {
      return seededStats
    }

    return seededStats
  }
}

async function incrementProfileViewsInFile() {
  const currentStats = await loadProfileViewsFromFile()
  const nextStats = createViewStats(currentStats.count + 1)

  await writeViewStatsToFile(nextStats)

  return nextStats
}

async function loadProfileViewsFromMongo() {
  const db = await getMongoDb()
  const collection = db.collection<StoredProfileViewDocument & { _id: string }>(collectionName)
  const existing = await collection.findOne({ _id: documentId })

  if (existing) {
    return readViewStats(existing)
  }

  const seededStats = createViewStats()

  await collection.updateOne(
    { _id: documentId },
    {
      $set: seededStats,
    },
    { upsert: true },
  )

  return seededStats
}

async function incrementProfileViewsInMongo() {
  const db = await getMongoDb()
  const collection = db.collection<StoredProfileViewDocument & { _id: string }>(collectionName)
  const updatedAt = new Date().toISOString()

  await collection.updateOne(
    { _id: documentId },
    {
      $inc: {
        count: 1,
      },
      $set: {
        updatedAt,
      },
    },
    { upsert: true },
  )

  const existing = await collection.findOne({ _id: documentId })

  if (!existing) {
    return {
      count: 1,
      updatedAt,
    }
  }

  return readViewStats(existing)
}

export async function loadProfileViews() {
  if (!getMongoAvailability().enabled) {
    return loadProfileViewsFromFile()
  }

  try {
    return await loadProfileViewsFromMongo()
  } catch (error) {
    console.warn('MongoDB view read failed, falling back to file view store.', error)
    return loadProfileViewsFromFile()
  }
}

export async function incrementProfileViews() {
  if (getMongoAvailability().enabled) {
    try {
      return await incrementProfileViewsInMongo()
    } catch (error) {
      console.warn('MongoDB view increment failed, falling back to file view store.', error)
    }
  }

  return incrementProfileViewsInFile()
}
