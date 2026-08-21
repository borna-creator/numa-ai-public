import { Router } from 'express'
import { requireSession, loadAppUser, requireSuperAdmin } from '../middleware/auth.js'
import { WORKER_CALLBACK_HEADER } from '../../shared/workerContract.js'
import { sanitizeUserFacingError } from '../../shared/userFacingErrors.js'

const router = Router()

function getWorkerUrl() {
  return process.env.WORKER_URL?.replace(/\/$/, '') || null
}

router.use(requireSession, loadAppUser, requireSuperAdmin)

router.get('/status', async (_req, res, next) => {
  try {
    const workerUrl = getWorkerUrl()
    if (!workerUrl) {
      return res.json({ available: false, reason: 'worker_url_missing' })
    }
    if (!process.env.WORKER_SECRET) {
      return res.json({ available: false, reason: 'worker_secret_missing' })
    }

    let response
    try {
      response = await fetch(`${workerUrl}/voice/status`, {
        headers: { [WORKER_CALLBACK_HEADER]: process.env.WORKER_SECRET },
      })
    } catch {
      return res.json({ available: false, reason: 'worker_unreachable' })
    }

    if (response.status === 401) {
      return res.json({ available: false, reason: 'worker_unauthorized' })
    }

    if (response.status === 404) {
      return res.json({ available: false, reason: 'worker_outdated' })
    }

    if (!response.ok) {
      return res.json({ available: false, reason: 'worker_error' })
    }

    const data = await response.json()
    res.json({
      available: Boolean(data.available),
      reason: data.available ? null : 'voice_not_configured',
      agentConfigured: Boolean(data.agentConfigured),
    })
  } catch (err) {
    next(err)
  }
})

router.post('/session', async (req, res, next) => {
  try {
    const workerUrl = getWorkerUrl()
    if (!workerUrl || !process.env.WORKER_SECRET) {
      return res.status(503).json({ error: 'Voice assistant is not available right now.' })
    }

    const response = await fetch(`${workerUrl}/voice/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [WORKER_CALLBACK_HEADER]: process.env.WORKER_SECRET,
      },
      body: JSON.stringify({
        participantId: req.appUser.id,
        participantName: req.appUser.fullName?.trim() || req.appUser.email,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return res.status(response.status).json({
        error: sanitizeUserFacingError(data.error, 'default') || 'Voice assistant is not available right now.',
      })
    }

    const session = data.session ?? data
    res.json({
      session: {
        sessionId: session.sessionId,
        connectUrl: session.connectUrl,
        accessToken: session.accessToken,
        agent: {
          configured: Boolean(session.agent?.configured),
          dispatched: Boolean(session.agent?.dispatched),
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
