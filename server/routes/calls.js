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

router.get('/', async (req, res, next) => {
  try {
    const calls = await prisma.call.findMany({
      where: callVisibilityFilter(req),
      orderBy: { createdAt: 'desc' },
      include: callInclude,
    })
    res.json({ calls })
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

async function createCallFromFile(req, file, { scorecardId, resolvedDepartmentId }) {
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

    const { scorecardId, departmentId } = req.body
    const context = await resolveUploadContext(req, { scorecardId, departmentId })

    const calls = []
    const errors = []

    for (const file of files) {
      try {
        const call = await createCallFromFile(req, file, context)
        calls.push(call)
      } catch (err) {
        errors.push({ fileName: file.originalname, error: err.message })
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

    const canDelete =
      req.appUser.role === 'SUPER_ADMIN' ||
      req.appUser.role === 'ORG_ADMIN' ||
      call.uploadedById === req.appUser.id

    if (!canDelete) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    await deleteCallFiles(call.storagePath)
    await prisma.call.delete({ where: { id: call.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
