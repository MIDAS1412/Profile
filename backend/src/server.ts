import cors from 'cors'
import express from 'express'
import { profilePayload } from './data/profile.js'
import { getMongoAvailability } from './lib/mongo.js'
import { loadProfile, resetProfile, saveProfile } from './lib/profileStore.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_request, response) => {
  const mongo = getMongoAvailability()

  response.json({
    ok: true,
    service: 'profile-backend',
    mongoEnabled: mongo.enabled,
    mongoConfigured: mongo.enabled,
    database: mongo.enabled ? mongo.dbName : null,
  })
})

app.get('/profile', async (_request, response) => {
  const result = await loadProfile()

  response.json({
    ...result.profile,
    _meta: {
      source: result.source,
      mongoEnabled: result.mongoEnabled,
    },
  })
})

app.put('/profile', async (request, response) => {
  try {
    const nextProfile = request.body as typeof profilePayload
    const savedProfile = await saveProfile(nextProfile)

    response.json({
      ...savedProfile,
      _meta: {
        source: 'mongo',
        mongoEnabled: true,
      },
    })
  } catch (error) {
    response.status(503).json({
      message: error instanceof Error ? error.message : 'Could not save profile to MongoDB',
    })
  }
})

app.post('/profile/reset', async (_request, response) => {
  try {
    const defaultProfile = await resetProfile()

    response.json({
      ...defaultProfile,
      _meta: {
        source: 'mongo',
        mongoEnabled: true,
      },
    })
  } catch (error) {
    response.status(503).json({
      message: error instanceof Error ? error.message : 'Could not reset profile in MongoDB',
    })
  }
})

app.listen(port, () => {
  console.log(`Profile backend listening on http://localhost:${port}`)
})
