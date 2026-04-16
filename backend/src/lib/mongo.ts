import { MongoClient } from 'mongodb'

const fallbackUri = process.env.VERCEL ? '' : ''
const uri = process.env.MONGODB_URI?.trim() ?? fallbackUri
const dbName = process.env.MONGODB_DB?.trim() || 'profile_admin'

let clientPromise: Promise<MongoClient> | null = null

export function getMongoAvailability() {
  return {
    enabled: Boolean(uri),
    uri,
    dbName,
  }
}

export async function getMongoClient() {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    })

    clientPromise = client.connect().catch((error) => {
      clientPromise = null
      throw error
    })
  }

  return clientPromise
}

export async function getMongoDb() {
  const client = await getMongoClient()

  return client.db(dbName)
}
