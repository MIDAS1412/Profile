import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { profileData, type ProfileApiResponse } from '../../shared/profile.js'
import { createAdminSession, getAdminConfig, verifyAdminCredentials, verifyAdminToken } from './lib/adminAuth.js'
import { loadLocalEnv } from './lib/loadEnv.js'
import { loadProfile, resetProfile, saveProfile } from './lib/profileStore.js'
import { parseProfileInput } from './lib/profileSchema.js'

loadLocalEnv()

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '1mb' }))

function buildProfileResponse(
  source: ProfileApiResponse['_meta']['source'],
  profile = profileData,
): ProfileApiResponse {
  return {
    ...profile,
    _meta: {
      source,
      generatedAt: new Date().toISOString(),
    },
  }
}

function getBearerToken(request: Request) {
  const authorization = request.header('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

function requireAdmin(request: Request, response: Response, next: NextFunction) {
  const adminConfig = getAdminConfig()

  if (!adminConfig.enabled) {
    response.status(503).json({
      ok: false,
      message: 'Admin login is not configured on the backend.',
    })
    return
  }

  const token = getBearerToken(request)
  const session = token ? verifyAdminToken(token) : null

  if (!session) {
    response.status(401).json({
      ok: false,
      message: 'Admin authentication required.',
    })
    return
  }

  response.locals.adminSession = session
  next()
}

app.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'profile-backend',
    docs: {
      health: '/health',
      profile: '/api/profile',
      adminLogin: '/api/admin/login',
      adminSession: '/api/admin/session',
    },
  })
})

app.get(['/health', '/api/health'], (_request, response) => {
  response.json({
    ok: true,
    service: 'profile-backend',
    environment: process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString(),
  })
})

app.get(['/profile', '/api/profile'], async (_request, response) => {
  const profile = await loadProfile()

  response.json(buildProfileResponse('railway-backend', profile))
})

app.post(['/admin/login', '/api/admin/login'], (request, response) => {
  const email = typeof request.body?.email === 'string' ? request.body.email : ''
  const password = typeof request.body?.password === 'string' ? request.body.password : ''

  const loginResult = verifyAdminCredentials(email, password)

  if (!loginResult.ok) {
    response.status(loginResult.message === 'Admin login is not configured on the backend.' ? 503 : 401).json({
      ok: false,
      message: loginResult.message,
    })
    return
  }

  const adminSession = createAdminSession(email)

  response.json({
    ok: true,
    token: adminSession.token,
    email: adminSession.session.email,
    expiresAt: adminSession.session.expiresAt,
  })
})

app.get(['/admin/session', '/api/admin/session'], requireAdmin, (_request, response) => {
  response.json({
    ok: true,
    ...response.locals.adminSession,
  })
})

app.post(['/admin/logout', '/api/admin/logout'], requireAdmin, (_request, response) => {
  response.json({
    ok: true,
  })
})

app.get(['/admin/profile', '/api/admin/profile'], requireAdmin, async (_request, response) => {
  const profile = await loadProfile()

  response.json(buildProfileResponse('railway-backend', profile))
})

app.put(['/admin/profile', '/api/admin/profile'], requireAdmin, async (request, response) => {
  try {
    const nextProfile = parseProfileInput(request.body)
    const savedProfile = await saveProfile(nextProfile)

    response.json(buildProfileResponse('railway-backend', savedProfile))
  } catch (error) {
    response.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Profile payload is invalid.',
    })
  }
})

app.post(['/admin/profile/reset', '/api/admin/profile/reset'], requireAdmin, async (_request, response) => {
  const resetValue = await resetProfile()

  response.json(buildProfileResponse('railway-backend', resetValue))
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Profile backend listening on http://0.0.0.0:${port}`)
})
