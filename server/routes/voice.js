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
      return res.json({ available: false })
    }

    const response = await fetch(`${workerUrl}/voice/status`, {
      headers: { [WORKER_CALLBACK_HEADER]: process.env.WORKER_SECRET },
    })

    if (!response.ok) {
      return res.json({ available: false })
    }

    const data = await response.json()
    res.json({ available: Boolean(data.available) })
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

    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
