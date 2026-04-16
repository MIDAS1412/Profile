import fs from 'node:fs/promises'
import path from 'node:path'
import { profileData, type ProfileResponse } from '../../../shared/profile.js'
import { getMongoAvailability, getMongoDb } from './mongo.js'
import { parseProfileInput } from './profileSchema.js'

type StoredProfileDocument = {
  _id?: string
  updatedAt: string
  profile: ProfileResponse
}

const collectionName = 'profiles'
const documentId = 'primary-profile'

function getStorePath() {
  const configuredPath = process.env.PROFILE_STORE_PATH?.trim()

  return configuredPath
    ? path.resolve(process.cwd(), configuredPath)
    : path.resolve(process.cwd(), 'data', 'profile-store.json')
}

async function persistProfileToFile(profile: ProfileResponse) {
  const normalizedProfile = parseProfileInput(profile)
  const storePath = getStorePath()
  const document: StoredProfileDocument = {
    updatedAt: new Date().toISOString(),
    profile: normalizedProfile,
  }

  await fs.mkdir(path.dirname(storePath), { recursive: true })
  await fs.writeFile(storePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')

  return normalizedProfile
}

async function loadProfileFromFile() {
  try {
    const rawValue = await fs.readFile(getStorePath(), 'utf8')
    const parsedValue = JSON.parse(rawValue) as StoredProfileDocument | ProfileResponse

    if (parsedValue && typeof parsedValue === 'object' && 'profile' in parsedValue) {
      return parseProfileInput(parsedValue.profile)
    }

    return parseProfileInput(parsedValue)
  } catch {
    try {
      await persistProfileToFile(profileData)
    } catch {
      return profileData
    }

    return profileData
  }
}

async function loadProfileFromMongo() {
  const db = await getMongoDb()
  const collection = db.collection<StoredProfileDocument & { _id: string }>(collectionName)
  const existing = await collection.findOne({ _id: documentId })

  if (existing?.profile) {
    return parseProfileInput(existing.profile)
  }

  const seededProfile = parseProfileInput(profileData)

  await collection.updateOne(
    { _id: documentId },
    {
      $set: {
        updatedAt: new Date().toISOString(),
        profile: seededProfile,
      },
    },
    { upsert: true },
  )

  return seededProfile
}

async function persistProfileToMongo(profile: ProfileResponse) {
  const normalizedProfile = parseProfileInput(profile)
  const db = await getMongoDb()
  const collection = db.collection<StoredProfileDocument & { _id: string }>(collectionName)

  await collection.updateOne(
    { _id: documentId },
    {
      $set: {
        updatedAt: new Date().toISOString(),
        profile: normalizedProfile,
      },
    },
    { upsert: true },
  )

  return normalizedProfile
}

export async function loadProfile() {
  if (!getMongoAvailability().enabled) {
    return loadProfileFromFile()
  }

  try {
    return await loadProfileFromMongo()
  } catch (error) {
    console.warn('MongoDB read failed, falling back to file profile store.', error)

    try {
      return await loadProfileFromFile()
    } catch {
      return profileData
    }
  }
}

export async function saveProfile(profile: ProfileResponse) {
  if (getMongoAvailability().enabled) {
    return persistProfileToMongo(profile)
  }

  return persistProfileToFile(profile)
}

export async function resetProfile() {
  return saveProfile(profileData)
}
