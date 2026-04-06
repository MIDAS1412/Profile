import type { ProfilePayload } from '../data/profile.js'
import { profilePayload } from '../data/profile.js'
import { getMongoAvailability, getMongoDb } from './mongo.js'

const collectionName = 'profiles'
const documentId = 'primary-profile'

export async function loadProfile() {
  const mongo = getMongoAvailability()

  if (!mongo.enabled) {
    return {
      profile: profilePayload,
      source: 'static' as const,
      mongoEnabled: false,
    }
  }

  try {
    const db = await getMongoDb()
    const collection = db.collection<ProfilePayload & { _id: string }>(collectionName)
    const existing = await collection.findOne({ _id: documentId })

    if (existing) {
      const { _id: _discard, ...profile } = existing

      return {
        profile,
        source: 'mongo' as const,
        mongoEnabled: true,
      }
    }

    await collection.insertOne({
      _id: documentId,
      ...profilePayload,
    })

    return {
      profile: profilePayload,
      source: 'mongo-seeded' as const,
      mongoEnabled: true,
    }
  } catch {
    return {
      profile: profilePayload,
      source: 'static-fallback' as const,
      mongoEnabled: true,
    }
  }
}

export async function saveProfile(profile: ProfilePayload) {
  const mongo = getMongoAvailability()

  if (!mongo.enabled) {
    throw new Error('MongoDB is not configured for this environment')
  }

  const db = await getMongoDb()
  const collection = db.collection<ProfilePayload & { _id: string }>(collectionName)

  await collection.updateOne(
    { _id: documentId },
    {
      $set: {
        ...profile,
      },
    },
    { upsert: true },
  )

  return profile
}

export async function resetProfile() {
  return saveProfile(profilePayload)
}
