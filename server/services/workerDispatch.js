import { prisma } from '../db.js'
import { createAudioAccessToken, createJobCallbackToken, getPublicApiBase } from './jobTokens.js'
import { WORKER_CALLBACK_HEADER } from '../../shared/workerContract.js'
import { sanitizeUserFacingError } from '../../shared/userFacingErrors.js'

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

export function buildJobPayload(job, call, dispatchedAt) {
  const apiBase = getPublicApiBase()
  const audioToken = createAudioAccessToken(call.id)
  const callbackToken = createJobCallbackToken(job.id, dispatchedAt.getTime())

  return {
    jobId: job.id,
    callId: call.id,
    organizationId: call.organizationId,
    audioUrl: `${apiBase}/api/internal/calls/${call.id}/audio?token=${audioToken}`,
    callbackUrl: `${apiBase}/api/internal/jobs/${job.id}/complete?token=${callbackToken}`,
    scorecard: {
      id: call.scorecard.id,
      name: call.scorecard.name,
      language: call.scorecard.language,
      sttSettings: normalizeSttSettings(call.scorecard.sttSettings),
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

function isJobInFlight(call) {
  return (
    call.status === 'PROCESSING' &&
    call.processingJob &&
    ['PENDING', 'DISPATCHED'].includes(call.processingJob.status)
  )
}

export async function startCallProcessing(callId) {
  const call = await loadCallForJob(callId)

  if (!call) {
    throw new Error('Call not found')
  }
  if (!call.scorecardId || !call.scorecard) {
    throw new Error('A scorecard is required before processing')
  }

  if (isJobInFlight(call)) {
    if (call.processingJob.status === 'DISPATCHED') {
      return call.processingJob
    }

    const workerUrl = getWorkerUrl()
    if (workerUrl) {
      await dispatchJob(call.processingJob.id)
    }
    return call.processingJob
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
      dispatchedAt: null,
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

  if (job.status === 'DISPATCHED') {
    return job
  }

  const workerUrl = getWorkerUrl()
  if (!workerUrl) {
    throw new Error('WORKER_URL is not configured')
  }

  const dispatchedAt = new Date()
  const payload = buildJobPayload(job, job.call, dispatchedAt)

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
        dispatchedAt,
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
        errorMessage: sanitizeUserFacingError(err.message, 'processing'),
      },
    })

    throw err
  }
}
