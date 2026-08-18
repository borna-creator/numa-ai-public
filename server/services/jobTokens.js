import crypto from 'node:crypto'

const DEFAULT_TTL_SEC = Number(process.env.JOB_AUDIO_TOKEN_TTL_SEC || 3600)

function getWorkerSecret() {
  const secret = process.env.WORKER_SECRET
  if (!secret) {
    throw new Error('WORKER_SECRET is not configured')
  }
  return secret
}

function signPayload(payload) {
  return crypto.createHmac('sha256', getWorkerSecret()).update(payload).digest('base64url')
}

export function createAudioAccessToken(callId, ttlSec = DEFAULT_TTL_SEC) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSec
  const payload = `${callId}:${expiresAt}`
  const signature = signPayload(payload)
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

export function verifyAudioAccessToken(callId, token) {
  if (!token?.includes('.')) {
    return false
  }

  const [encodedPayload, signature] = token.split('.')
  let payload
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf8')
  } catch {
    return false
  }

  const expected = signPayload(payload)
  if (signature.length !== expected.length) {
    return false
  }
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false
  }

  const [tokenCallId, expiresAtRaw] = payload.split(':')
  if (tokenCallId !== callId) {
    return false
  }

  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return false
  }

  return true
}

export function verifyWorkerSecret(headerValue) {
  if (!headerValue || !process.env.WORKER_SECRET) {
    return false
  }

  const expected = process.env.WORKER_SECRET
  if (headerValue.length !== expected.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(headerValue), Buffer.from(expected))
}

export function getPublicApiBase() {
  return (process.env.API_DOMAIN || process.env.WEBSITE_DOMAIN || 'http://localhost:3001').replace(/\/$/, '')
}
