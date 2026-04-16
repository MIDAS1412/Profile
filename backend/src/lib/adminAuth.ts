import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const fallbackSessionSecret = randomBytes(32).toString('hex')

type AdminConfig = {
  enabled: boolean
  email: string | null
  password: string | null
  passwordHash: string | null
  sessionSecret: string
  sessionTtlMs: number
}

type TokenPayload = {
  sub: string
  exp: number
}

export type AdminSession = {
  email: string
  expiresAt: string
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function safeCompare(left: Buffer, right: Buffer) {
  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

function signTokenBody(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('base64url')
}

function verifyPasswordHash(password: string, encodedHash: string) {
  const [scheme, saltHex, hashHex] = encodedHash.split(':')

  if (scheme !== 'scrypt' || !saltHex || !hashHex) {
    return false
  }

  const expectedHash = Buffer.from(hashHex, 'hex')
  const derivedHash = scryptSync(password, Buffer.from(saltHex, 'hex'), expectedHash.length)

  return safeCompare(derivedHash, expectedHash)
}

export function getAdminConfig(): AdminConfig {
  const rawTtlHours = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12)
  const sessionTtlMs = Number.isFinite(rawTtlHours) && rawTtlHours > 0 ? rawTtlHours * 60 * 60 * 1000 : 12 * 60 * 60 * 1000
  const email = process.env.ADMIN_EMAIL?.trim() ?? null
  const password = process.env.ADMIN_PASSWORD?.trim() ?? null
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? null

  return {
    enabled: Boolean(email && (password || passwordHash)),
    email,
    password,
    passwordHash,
    sessionSecret: process.env.ADMIN_SESSION_SECRET?.trim() || fallbackSessionSecret,
    sessionTtlMs,
  }
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = getAdminConfig()

  if (!config.enabled || !config.email) {
    return {
      ok: false,
      message: 'Admin login is not configured on the backend.',
    }
  }

  if (normalizeEmail(email) !== normalizeEmail(config.email)) {
    return {
      ok: false,
      message: 'Sai email hoac mat khau.',
    }
  }

  const passwordIsValid = config.password
    ? safeCompare(Buffer.from(password), Buffer.from(config.password))
    : config.passwordHash
      ? verifyPasswordHash(password, config.passwordHash)
      : false

  return {
    ok: passwordIsValid,
    message: passwordIsValid ? null : 'Sai email hoac mat khau.',
  }
}

export function createAdminSession(email: string): { token: string; session: AdminSession } {
  const config = getAdminConfig()
  const normalizedEmail = normalizeEmail(email)
  const payload: TokenPayload = {
    sub: normalizedEmail,
    exp: Date.now() + config.sessionTtlMs,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = signTokenBody(body, config.sessionSecret)

  return {
    token: `${body}.${signature}`,
    session: {
      email: normalizedEmail,
      expiresAt: new Date(payload.exp).toISOString(),
    },
  }
}

export function verifyAdminToken(token: string): AdminSession | null {
  const config = getAdminConfig()

  if (!config.enabled || !config.email) {
    return null
  }

  const [body, signature] = token.split('.')

  if (!body || !signature) {
    return null
  }

  const expectedSignature = signTokenBody(body, config.sessionSecret)

  if (!safeCompare(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null
  }

  let payload: TokenPayload

  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload
  } catch {
    return null
  }

  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
    return null
  }

  if (payload.exp <= Date.now()) {
    return null
  }

  if (normalizeEmail(payload.sub) !== normalizeEmail(config.email)) {
    return null
  }

  return {
    email: normalizeEmail(payload.sub),
    expiresAt: new Date(payload.exp).toISOString(),
  }
}
