import crypto from 'node:crypto'
import type { Request } from 'express'
import geoip from 'geoip-lite'
import { UAParser } from 'ua-parser-js'
import type { ProfileVisitEntry, ProfileVisitLocation } from '../../../shared/profile.js'

type VisitClientPayload = {
  pagePath?: unknown
  pageUrl?: unknown
  referrer?: unknown
}

const countryNameFormatter =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], {
        type: 'region',
      })
    : null

function readTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeIp(value: string) {
  let normalized = value.trim()

  if (!normalized) {
    return 'Unknown'
  }

  if (normalized.includes(',')) {
    normalized = normalized.split(',')[0]?.trim() ?? normalized
  }

  if (normalized.startsWith('::ffff:')) {
    normalized = normalized.slice('::ffff:'.length)
  }

  if (normalized === '::1') {
    return '127.0.0.1'
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(normalized)) {
    normalized = normalized.replace(/:\d+$/, '')
  }

  return normalized || 'Unknown'
}

function getClientIp(request: Request) {
  const candidates = [
    request.header('cf-connecting-ip'),
    request.header('true-client-ip'),
    request.header('x-real-ip'),
    request.header('fly-client-ip'),
    request.header('x-client-ip'),
    request.header('fastly-client-ip'),
    request.header('x-forwarded-for'),
    request.ip,
    request.socket.remoteAddress,
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    const normalized = normalizeIp(candidate)

    if (normalized) {
      return normalized
    }
  }

  return 'Unknown'
}

function isPrivateOrLocalIp(ip: string) {
  if (ip === 'Unknown') {
    return true
  }

  const normalized = ip.toLowerCase()

  return (
    normalized === '127.0.0.1' ||
    normalized === 'localhost' ||
    normalized === '::1' ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized) ||
    normalized.startsWith('169.254.') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd')
  )
}

function resolveCountryName(countryCode: string | null) {
  if (!countryCode) {
    return null
  }

  try {
    return countryNameFormatter?.of(countryCode.toUpperCase()) ?? countryCode.toUpperCase()
  } catch {
    return countryCode.toUpperCase()
  }
}

function readEdgeLocation(request: Request): ProfileVisitLocation | null {
  const countryCode = readTrimmedString(
    request.header('x-vercel-ip-country') ??
      request.header('cf-ipcountry') ??
      request.header('x-country-code'),
  ).toUpperCase()
  const region = readTrimmedString(
    request.header('x-vercel-ip-country-region') ?? request.header('x-region'),
  )
  const city = readTrimmedString(request.header('x-vercel-ip-city') ?? request.header('x-city'))

  if (!countryCode && !region && !city) {
    return null
  }

  return {
    country: resolveCountryName(countryCode || null),
    countryCode: countryCode || null,
    region: region || null,
    city: city || null,
    source: 'edge-header',
  }
}

function readGeoLookup(ip: string): ProfileVisitLocation | null {
  if (isPrivateOrLocalIp(ip)) {
    return null
  }

  const result = geoip.lookup(ip)

  if (!result) {
    return null
  }

  return {
    country: resolveCountryName(result.country ?? null),
    countryCode: result.country ?? null,
    region: result.region || null,
    city: result.city || null,
    source: 'geoip',
  }
}

function readLocation(request: Request, ip: string): ProfileVisitLocation {
  return (
    readEdgeLocation(request) ??
    readGeoLookup(ip) ?? {
      country: null,
      countryCode: null,
      region: null,
      city: null,
      source: 'unknown',
    }
  )
}

function normalizePath(value: string, pageUrl: string | null) {
  if (value) {
    return value.startsWith('/') ? value : `/${value}`
  }

  if (pageUrl) {
    try {
      const parsedUrl = new URL(pageUrl)
      const normalizedFromUrl = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
      return normalizedFromUrl || '/'
    } catch {
      return '/'
    }
  }

  return '/'
}

function normalizeReferrer(value: string) {
  return value || null
}

function readUtmSource(pageUrl: string | null) {
  if (!pageUrl) {
    return ''
  }

  try {
    return new URL(pageUrl).searchParams.get('utm_source')?.trim() ?? ''
  } catch {
    return ''
  }
}

function inferSourceName(hostname: string) {
  const normalized = hostname.replace(/^www\./i, '').toLowerCase()

  if (!normalized) {
    return 'Direct'
  }

  if (normalized.includes('google')) {
    return 'Google'
  }

  if (normalized.includes('facebook') || normalized === 'fb.com') {
    return 'Facebook'
  }

  if (normalized.includes('instagram')) {
    return 'Instagram'
  }

  if (normalized === 't.co' || normalized.includes('twitter') || normalized === 'x.com') {
    return 'X'
  }

  if (normalized.includes('linkedin')) {
    return 'LinkedIn'
  }

  if (normalized.includes('github')) {
    return 'GitHub'
  }

  if (normalized.includes('youtube')) {
    return 'YouTube'
  }

  if (normalized.includes('zalo')) {
    return 'Zalo'
  }

  return normalized
}

function readTrafficSource(referrer: string | null, pageUrl: string | null) {
  const utmSource = readUtmSource(pageUrl)

  if (utmSource) {
    return utmSource
  }

  if (!referrer) {
    return 'Direct'
  }

  try {
    return inferSourceName(new URL(referrer).hostname)
  } catch {
    return referrer
  }
}

function readDeviceDetails(userAgent: string) {
  const isBot = /bot|crawler|crawl|spider|preview|slurp|wget|headless/i.test(userAgent)
  const parser = new UAParser(userAgent)
  const browserName = parser.getBrowser().name ?? 'Unknown browser'
  const browserVersion = parser.getBrowser().version ?? ''
  const browser = browserVersion ? `${browserName} ${browserVersion}` : browserName
  const osName = parser.getOS().name ?? 'Unknown OS'
  const osVersion = parser.getOS().version ?? ''
  const os = osVersion ? `${osName} ${osVersion}` : osName
  const device = parser.getDevice()
  const type = isBot ? 'bot' : device.type ?? 'desktop'
  const vendor = device.vendor ?? ''
  const model = device.model ?? ''
  const fallbackLabel =
    type === 'desktop'
      ? 'Desktop'
      : type.charAt(0).toUpperCase() + type.slice(1)
  const vendorModel = [vendor, model].filter(Boolean).join(' ').trim()

  return {
    browser,
    os,
    deviceType: type,
    deviceLabel: vendorModel ? `${fallbackLabel} · ${vendorModel}` : fallbackLabel,
  }
}

function createVisitId(viewedAt: string) {
  const timestamp = viewedAt.replace(/\D/g, '').slice(0, 14)
  return `visit_${timestamp}_${crypto.randomBytes(4).toString('hex')}`
}

export function captureProfileVisit(request: Request, rawPayload: VisitClientPayload = {}): ProfileVisitEntry {
  const pagePath = readTrimmedString(rawPayload.pagePath)
  const pageUrl = readTrimmedString(rawPayload.pageUrl) || null
  const referrer = normalizeReferrer(
    readTrimmedString(rawPayload.referrer) || readTrimmedString(request.header('referer')),
  )
  const viewedAt = new Date().toISOString()
  const ip = getClientIp(request)
  const userAgent = readTrimmedString(request.header('user-agent'))
  const location = readLocation(request, ip)
  const deviceDetails = readDeviceDetails(userAgent)

  return {
    id: createVisitId(viewedAt),
    viewedAt,
    ip,
    path: normalizePath(pagePath, pageUrl),
    referrer,
    source: readTrafficSource(referrer, pageUrl),
    userAgent,
    browser: deviceDetails.browser,
    os: deviceDetails.os,
    deviceType: deviceDetails.deviceType,
    deviceLabel: deviceDetails.deviceLabel,
    location,
  }
}
