import { MongoClient } from 'mongodb'

const uri =
  process.env.MONGODB_URI ??
  (process.env.VERCEL ? '' : 'mongodb://localhost:27017/')

const dbName = process.env.MONGODB_DB ?? 'profile_admin'

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
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    })

    clientPromise = client.connect()
  }

  return clientPromise
}

export async function getMongoDb() {
  const client = await getMongoClient()

  return client.db(dbName)
}
