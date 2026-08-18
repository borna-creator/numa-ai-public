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

const upload = multer({
  dest: getUploadTmpDir(),
  limits: { fileSize: maxUploadBytes, files: 1 },
  fileFilter(_req, file, cb) {
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
  },
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

router.post('/', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' })
    }

    const { scorecardId, departmentId } = req.body

    if (scorecardId) {
      const scorecard = await prisma.scorecard.findFirst({
        where: { id: scorecardId, organizationId: req.organizationId, isActive: true },
      })
      if (!scorecard) {
        return res.status(400).json({ error: 'Invalid or inactive scorecard' })
      }
    }

    let resolvedDepartmentId = req.appUser.departmentId || null
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: req.organizationId },
      })
      if (!department) {
        return res.status(400).json({ error: 'Invalid department' })
      }
      if (req.appUser.role === 'USER' && req.appUser.departmentId !== departmentId) {
        return res.status(403).json({ error: 'Cannot upload to another department' })
      }
      resolvedDepartmentId = departmentId
    }

    const call = await prisma.call.create({
      data: {
        organizationId: req.organizationId,
        departmentId: resolvedDepartmentId,
        uploadedById: req.appUser.id,
        scorecardId: scorecardId || null,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storagePath: 'pending',
        status: 'PENDING',
      },
    })

    let storagePath
    try {
      storagePath = await finalizeCallUpload(
        req.organizationId,
        call.id,
        req.file.path,
        req.file.originalname,
      )
    } catch (err) {
      await prisma.call.delete({ where: { id: call.id } })
      throw err
    }

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

    res.status(201).json({ call: updated })
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
