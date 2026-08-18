import { prisma } from '../db.js'
import { createAudioAccessToken, getPublicApiBase } from './jobTokens.js'
import { WORKER_CALLBACK_HEADER } from '../../shared/workerContract.js'

function getWorkerUrl() {
  return process.env.WORKER_URL?.replace(/\/$/, '') || null
}

async function loadCallForJob(callId) {
  return prisma.call.findUnique({
    where: { id: callId },
    include: {
      scorecard: {
        include: { criteria: { orderBy: { sortOrder: 'asc' } } },
      },
      processingJob: true,
    },
  })
}

export function buildJobPayload(job, call) {
  const apiBase = getPublicApiBase()
  const token = createAudioAccessToken(call.id)

  return {
    jobId: job.id,
    callId: call.id,
    organizationId: call.organizationId,
    audioUrl: `${apiBase}/api/internal/calls/${call.id}/audio?token=${token}`,
    callbackUrl: `${apiBase}/api/internal/jobs/${job.id}/complete`,
    scorecard: {
      id: call.scorecard.id,
      name: call.scorecard.name,
      language: call.scorecard.language,
      criteria: call.scorecard.criteria.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        questionType: c.questionType,
        weight: c.weight,
      })),
    },
  }
}

export async function startCallProcessing(callId) {
  const call = await loadCallForJob(callId)

  if (!call) {
    throw new Error('Call not found')
  }
  if (!call.scorecardId || !call.scorecard) {
    throw new Error('A scorecard is required before processing')
  }

  const job = await prisma.processingJob.upsert({
    where: { callId: call.id },
    create: {
      callId: call.id,
      organizationId: call.organizationId,
      status: 'PENDING',
    },
    update: {
      status: 'PENDING',
      lastError: null,
      completedAt: null,
    },
  })

  await prisma.call.update({
    where: { id: call.id },
    data: { status: 'PROCESSING', errorMessage: null, overallScore: null },
  })

  await prisma.callCriterionResult.deleteMany({ where: { callId: call.id } })
  await prisma.callTranscript.deleteMany({ where: { callId: call.id } })

  const workerUrl = getWorkerUrl()
  if (!workerUrl) {
    console.warn(`WORKER_URL not set — job ${job.id} queued but not dispatched`)
    return job
  }

  await dispatchJob(job.id)
  return job
}

export async function dispatchJob(jobId) {
  const job = await prisma.processingJob.findUnique({
    where: { id: jobId },
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

  if (!job?.call?.scorecard) {
    throw new Error('Job or scorecard not found')
  }

  const workerUrl = getWorkerUrl()
  if (!workerUrl) {
    throw new Error('WORKER_URL is not configured')
  }

  const payload = buildJobPayload(job, job.call)

  try {
    const response = await fetch(`${workerUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [WORKER_CALLBACK_HEADER]: process.env.WORKER_SECRET,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Worker rejected job (${response.status}): ${body}`)
    }

    await prisma.processingJob.update({
      where: { id: job.id },
      data: {
        status: 'DISPATCHED',
        attempts: { increment: 1 },
        dispatchedAt: new Date(),
        lastError: null,
      },
    })

    return job
  } catch (err) {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        lastError: err.message,
      },
    })

    await prisma.call.update({
      where: { id: job.callId },
      data: {
        status: 'FAILED',
        errorMessage: `Failed to dispatch to worker: ${err.message}`,
      },
    })

    throw err
  }
}
