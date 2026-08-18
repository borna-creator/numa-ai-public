import { Router } from 'express'
import { prisma } from '../db.js'
import { verifyAudioAccessToken, verifyWorkerSecret } from '../services/jobTokens.js'
import { createCallReadStream } from '../services/storage.js'
import { computeOverallScore, normalizeCallbackResults } from '../services/scoring.js'
import { WORKER_CALLBACK_HEADER } from '../../shared/workerContract.js'

const router = Router()

function requireWorkerSecret(req, res, next) {
  const secret = req.get(WORKER_CALLBACK_HEADER)
  if (!verifyWorkerSecret(secret)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.get('/calls/:callId/audio', async (req, res, next) => {
  try {
    const { callId } = req.params
    const { token } = req.query

    if (!verifyAudioAccessToken(callId, token)) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const call = await prisma.call.findUnique({ where: { id: callId } })
    if (!call) {
      return res.status(404).json({ error: 'Call not found' })
    }

    res.setHeader('Content-Type', call.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${call.originalName}"`)
    createCallReadStream(call.storagePath).pipe(res)
  } catch (err) {
    next(err)
  }
})

router.post('/jobs/:jobId/complete', requireWorkerSecret, async (req, res, next) => {
  try {
    const job = await prisma.processingJob.findUnique({
      where: { id: req.params.jobId },
      include: {
        call: {
          include: {
            scorecard: {
              include: { criteria: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    })

    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const { status, transcript, results, errorMessage } = req.body

    if (status === 'FAILED') {
      await prisma.$transaction([
        prisma.processingJob.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            lastError: errorMessage?.trim() || 'Worker reported failure',
            completedAt: new Date(),
          },
        }),
        prisma.call.update({
          where: { id: job.callId },
          data: {
            status: 'FAILED',
            errorMessage: errorMessage?.trim() || 'Processing failed',
          },
        }),
      ])

      return res.json({ ok: true })
    }

    if (status !== 'COMPLETED') {
      return res.status(400).json({ error: 'status must be COMPLETED or FAILED' })
    }

    if (!transcript?.fullText?.trim()) {
      return res.status(400).json({ error: 'transcript.fullText is required' })
    }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'results array is required' })
    }

    const criteria = job.call.scorecard?.criteria ?? []
    const normalized = normalizeCallbackResults(results, criteria)
    const overallScore = computeOverallScore(normalized, criteria)

    await prisma.$transaction(async (tx) => {
      await tx.callTranscript.upsert({
        where: { callId: job.callId },
        create: {
          callId: job.callId,
          fullText: transcript.fullText.trim(),
          segments: transcript.segments ?? null,
        },
        update: {
          fullText: transcript.fullText.trim(),
          segments: transcript.segments ?? null,
        },
      })

      await tx.callCriterionResult.deleteMany({ where: { callId: job.callId } })
      await tx.callCriterionResult.createMany({
        data: normalized.map((r) => ({
          callId: job.callId,
          criterionId: r.criterionId,
          value: r.value,
          passed: r.passed,
          reasoning: r.reasoning,
        })),
      })

      await tx.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          lastError: null,
          completedAt: new Date(),
        },
      })

      await tx.call.update({
        where: { id: job.callId },
        data: {
          status: 'COMPLETED',
          errorMessage: null,
          overallScore,
        },
      })
    })

    res.json({ ok: true, overallScore })
  } catch (err) {
    next(err)
  }
})

export default router
