import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../db.js'
import { requireSession, loadAppUser } from '../middleware/auth.js'
import { requireOrgContext } from '../middleware/orgAccess.js'
import {
  deleteCallFiles,
  finalizeCallUpload,
  createCallReadStream,
  getUploadTmpDir,
} from '../services/storage.js'
import { startCallProcessing } from '../services/workerDispatch.js'
import { assertOrgWithinUsageCap, getOrgUsageSummary } from '../services/usage.js'
import { sanitizeUserFacingError } from '../../shared/userFacingErrors.js'

const router = Router({ mergeParams: true })

const maxUploadBytes = Number(process.env.CALL_MAX_UPLOAD_BYTES || 100 * 1024 * 1024)
const maxBatchFiles = Number(process.env.CALL_MAX_BATCH_FILES || 20)

const audioFileFilter = (_req, file, cb) => {
  const allowedTypes = new Set([
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/webm',
    'video/webm',
  ])
  const allowedExt = /\.(mp3|wav|m4a|ogg|webm)$/i

  if (allowedTypes.has(file.mimetype) || allowedExt.test(file.originalname)) {
    cb(null, true)
    return
  }
  cb(new Error('Unsupported audio format. Use MP3, WAV, M4A, OGG, or WEBM.'))
}

const upload = multer({
  dest: getUploadTmpDir(),
  limits: { fileSize: maxUploadBytes, files: maxBatchFiles },
  fileFilter: audioFileFilter,
})

router.use(requireSession, loadAppUser, requireOrgContext)

const callInclude = {
  scorecard: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  uploadedBy: { select: { id: true, email: true, fullName: true, jobTitle: true } },
  transcript: true,
  results: {
    include: {
      criterion: { select: { id: true, label: true, questionType: true, weight: true } },
    },
  },
}

function normalizeTags(input) {
  if (input == null || input === '') return []

  let raw = input
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) raw = parsed
    } catch {
      raw = raw.split(',')
    }
  }

  if (!Array.isArray(raw)) return []

  const seen = new Set()
  const tags = []
  for (const item of raw) {
    const tag = String(item).trim().toLowerCase()
    if (!tag || seen.has(tag) || tags.length >= 20) continue
    seen.add(tag)
    tags.push(tag)
  }
  return tags
}

function callVisibilityFilter(req) {
  if (req.appUser.role === 'ORG_ADMIN' || req.appUser.role === 'SUPER_ADMIN') {
    return { organizationId: req.organizationId }
  }

  return {
    organizationId: req.organizationId,
    OR: [
      { uploadedById: req.appUser.id },
      ...(req.appUser.departmentId ? [{ departmentId: req.appUser.departmentId }] : []),
    ],
  }
}

function buildCallListWhere(req) {
  const base = callVisibilityFilter(req)
  const { q, departmentId, uploadedById, dateFrom, dateTo, tag } = req.query
  const clauses = [base]

  if (departmentId) {
    clauses.push({ departmentId: String(departmentId) })
  }

  if (uploadedById) {
    clauses.push({ uploadedById: String(uploadedById) })
  }

  if (tag?.trim()) {
    clauses.push({ tags: { has: String(tag).trim().toLowerCase() } })
  }

  if (dateFrom || dateTo) {
    const createdAt = {}
    if (dateFrom) {
      const start = new Date(String(dateFrom))
      if (!Number.isNaN(start.getTime())) createdAt.gte = start
    }
    if (dateTo) {
      const end = new Date(String(dateTo))
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999)
        createdAt.lte = end
      }
    }
    if (Object.keys(createdAt).length > 0) {
      clauses.push({ createdAt })
    }
  }

  if (q?.trim()) {
    const term = String(q).trim()
    clauses.push({
      OR: [
        { originalName: { contains: term, mode: 'insensitive' } },
        { tags: { has: term.toLowerCase() } },
        { uploadedBy: { fullName: { contains: term, mode: 'insensitive' } } },
        { uploadedBy: { email: { contains: term, mode: 'insensitive' } } },
        { department: { name: { contains: term, mode: 'insensitive' } } },
      ],
    })
  }

  return clauses.length === 1 ? base : { AND: clauses }
}

function isOrgAdmin(req) {
  return req.appUser.role === 'SUPER_ADMIN' || req.appUser.role === 'ORG_ADMIN'
}

router.get('/', async (req, res, next) => {
  try {
    const calls = await prisma.call.findMany({
      where: buildCallListWhere(req),
      orderBy: { createdAt: 'desc' },
      include: callInclude,
    })

    const payload = { calls }
    if (isOrgAdmin(req)) {
      payload.usage = await getOrgUsageSummary(req.organizationId)
    }

    res.json(payload)
  } catch (err) {
    next(err)
  }
})

router.get('/:callId', async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.callId, ...callVisibilityFilter(req) },
      include: {
        ...callInclude,
        scorecard: {
          select: {
            id: true,
            name: true,
            language: true,
            criteria: { orderBy: { sortOrder: 'asc' } },
          },
        },
        transcript: true,
        results: {
          orderBy: { criterion: { sortOrder: 'asc' } },
          include: {
            criterion: {
              select: { id: true, label: true, questionType: true, weight: true, description: true },
            },
          },
        },
      },
    })

    if (!call) {
      return res.status(404).json({ error: 'Call not found' })
    }

    res.json({ call })
  } catch (err) {
    next(err)
  }
})

async function resolveUploadContext(req, { scorecardId, departmentId }) {
  await assertOrgWithinUsageCap(req.organizationId)

  if (scorecardId) {
    const scorecard = await prisma.scorecard.findFirst({
      where: { id: scorecardId, organizationId: req.organizationId, isActive: true },
    })
    if (!scorecard) {
      const err = new Error('Invalid or inactive scorecard')
      err.status = 400
      throw err
    }
  }

  let resolvedDepartmentId = req.appUser.departmentId || null
  if (departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, organizationId: req.organizationId },
    })
    if (!department) {
      const err = new Error('Invalid department')
      err.status = 400
      throw err
    }
    if (req.appUser.role === 'USER' && req.appUser.departmentId !== departmentId) {
      const err = new Error('Cannot upload to another department')
      err.status = 403
      throw err
    }
    resolvedDepartmentId = departmentId
  }

  return { scorecardId: scorecardId || null, resolvedDepartmentId }
}

async function createCallFromFile(req, file, { scorecardId, resolvedDepartmentId, tags }) {
  const call = await prisma.call.create({
    data: {
      organizationId: req.organizationId,
      departmentId: resolvedDepartmentId,
      uploadedById: req.appUser.id,
      scorecardId: scorecardId || null,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storagePath: 'pending',
      tags,
      status: 'PENDING',
    },
  })

  try {
    const storagePath = await finalizeCallUpload(
      req.organizationId,
      call.id,
      file.path,
      file.originalname,
    )

    const updated = await prisma.call.update({
      where: { id: call.id },
      data: { storagePath },
      include: callInclude,
    })

    if (scorecardId) {
      startCallProcessing(call.id).catch((err) => {
        console.error(`Failed to start processing for call ${call.id}:`, err.message)
      })
    }

    return updated
  } catch (err) {
    await prisma.call.delete({ where: { id: call.id } })
    throw err
  }
}

router.post('/', upload.array('audio', maxBatchFiles), async (req, res, next) => {
  try {
    const files = req.files ?? []
    if (files.length === 0) {
      return res.status(400).json({ error: 'At least one audio file is required' })
    }

    const { scorecardId, departmentId, tags: tagsInput } = req.body
    const context = await resolveUploadContext(req, { scorecardId, departmentId })
    const tags = normalizeTags(tagsInput)

    const calls = []
    const errors = []

    for (const file of files) {
      try {
        const call = await createCallFromFile(req, file, { ...context, tags })
        calls.push(call)
      } catch (err) {
        errors.push({
          fileName: file.originalname,
          error: sanitizeUserFacingError(err.message, 'upload'),
        })
      }
    }

    if (calls.length === 0) {
      return res.status(400).json({ error: errors[0]?.error || 'Upload failed' })
    }

    res.status(201).json({
      calls,
      call: calls[0],
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    next(err)
  }
})

router.patch('/:callId', async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.callId, ...callVisibilityFilter(req) },
    })

    if (!call) {
      return res.status(404).json({ error: 'Call not found' })
    }

    const canEdit =
      isOrgAdmin(req) || call.uploadedById === req.appUser.id

    if (!canEdit) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    if (req.body.tags === undefined) {
      return res.status(400).json({ error: 'tags field is required' })
    }

    const updated = await prisma.call.update({
      where: { id: call.id },
      data: { tags: normalizeTags(req.body.tags) },
      include: callInclude,
    })

    res.json({ call: updated })
  } catch (err) {
    next(err)
  }
})

router.post('/:callId/process', async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.callId, ...callVisibilityFilter(req) },
    })

    if (!call) {
      return res.status(404).json({ error: 'Call not found' })
    }

    if (req.appUser.role === 'USER' && call.uploadedById !== req.appUser.id) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    if (!call.scorecardId) {
      return res.status(400).json({ error: 'Assign a scorecard before processing' })
    }

    await assertOrgWithinUsageCap(req.organizationId)
    await startCallProcessing(call.id)

    const refreshed = await prisma.call.findFirst({
      where: { id: call.id },
      include: {
        ...callInclude,
        scorecard: {
          select: {
            id: true,
            name: true,
            language: true,
            criteria: { orderBy: { sortOrder: 'asc' } },
          },
        },
        transcript: true,
        results: {
          orderBy: { criterion: { sortOrder: 'asc' } },
          include: {
            criterion: {
              select: { id: true, label: true, questionType: true, weight: true, description: true },
            },
          },
        },
      },
    })

    res.json({ call: refreshed })
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message })
    }
    next(err)
  }
})

router.get('/:callId/audio', async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.callId, ...callVisibilityFilter(req) },
    })

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

router.delete('/:callId', async (req, res, next) => {
  try {
    const call = await prisma.call.findFirst({
      where: { id: req.params.callId, organizationId: req.organizationId },
    })

    if (!call) {
      return res.status(404).json({ error: 'Call not found' })
    }

    if (!isOrgAdmin(req)) {
      return res.status(403).json({ error: 'Only administrators can delete calls' })
    }

    await deleteCallFiles(call.storagePath)
    await prisma.call.delete({ where: { id: call.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
