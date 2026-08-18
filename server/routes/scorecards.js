import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireOrgAdminOrSuper } from '../middleware/auth.js'
import { requireOrgContext } from '../middleware/orgAccess.js'
import {
  DEFAULT_CRITERION_QUESTION_TYPE,
  isValidCriterionQuestionType,
} from '../../shared/criterionQuestionTypes.js'

const router = Router({ mergeParams: true })

router.use(requireSession, loadAppUser, requireOrgContext)

const scorecardInclude = {
  criteria: { orderBy: { sortOrder: 'asc' } },
  _count: { select: { calls: true } },
}

function parseCriteria(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null
  }

  return raw.map((item, index) => {
    if (!item?.label?.trim()) {
      throw new Error('Each criterion needs a label')
    }
    const weight = Number(item.weight ?? 1)
    if (!Number.isFinite(weight) || weight < 1) {
      throw new Error('Criterion weight must be at least 1')
    }
    const questionType = item.questionType ?? DEFAULT_CRITERION_QUESTION_TYPE
    if (!isValidCriterionQuestionType(questionType)) {
      throw new Error('Invalid criterion question type')
    }
    return {
      label: item.label.trim(),
      description: item.description?.trim() || null,
      questionType,
      weight: Math.round(weight),
      sortOrder: index,
    }
  })
}

router.get('/', async (req, res, next) => {
  try {
    const scorecards = await prisma.scorecard.findMany({
      where: { organizationId: req.organizationId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: scorecardInclude,
    })
    res.json({ scorecards })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const { name, description, isActive = true, criteria } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Scorecard name is required' })
    }

    let parsedCriteria
    try {
      parsedCriteria = parseCriteria(criteria)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }
    if (!parsedCriteria) {
      return res.status(400).json({ error: 'At least one criterion is required' })
    }

    const scorecard = await prisma.scorecard.create({
      data: {
        organizationId: req.organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
        criteria: { create: parsedCriteria },
      },
      include: scorecardInclude,
    })

    res.status(201).json({ scorecard })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Scorecard name already exists in this organization' })
    }
    next(err)
  }
})

router.patch('/:scorecardId', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const existing = await prisma.scorecard.findFirst({
      where: { id: req.params.scorecardId, organizationId: req.organizationId },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Scorecard not found' })
    }

    const { name, description, isActive, criteria } = req.body
    const data = {}

    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({ error: 'Scorecard name cannot be empty' })
      }
      data.name = name.trim()
    }
    if (description !== undefined) data.description = description?.trim() || null
    if (isActive !== undefined) data.isActive = Boolean(isActive)

    let parsedCriteria
    if (criteria !== undefined) {
      try {
        parsedCriteria = parseCriteria(criteria)
      } catch (err) {
        return res.status(400).json({ error: err.message })
      }
      if (!parsedCriteria) {
        return res.status(400).json({ error: 'At least one criterion is required' })
      }
    }

    const scorecard = await prisma.$transaction(async (tx) => {
      if (parsedCriteria) {
        await tx.scorecardCriterion.deleteMany({ where: { scorecardId: existing.id } })
        await tx.scorecardCriterion.createMany({
          data: parsedCriteria.map((c) => ({ ...c, scorecardId: existing.id })),
        })
      }

      return tx.scorecard.update({
        where: { id: existing.id },
        data,
        include: scorecardInclude,
      })
    })

    res.json({ scorecard })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Scorecard name already exists in this organization' })
    }
    next(err)
  }
})

router.delete('/:scorecardId', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const existing = await prisma.scorecard.findFirst({
      where: { id: req.params.scorecardId, organizationId: req.organizationId },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Scorecard not found' })
    }

    await prisma.scorecard.delete({ where: { id: existing.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/:scorecardId', async (req, res, next) => {
  try {
    const scorecard = await prisma.scorecard.findFirst({
      where: { id: req.params.scorecardId, organizationId: req.organizationId },
      include: scorecardInclude,
    })
    if (!scorecard) {
      return res.status(404).json({ error: 'Scorecard not found' })
    }
    res.json({ scorecard })
  } catch (err) {
    next(err)
  }
})

export default router
