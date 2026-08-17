import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireOrgAdminOrSuper } from '../middleware/auth.js'

const router = Router({ mergeParams: true })

router.use(requireSession, loadAppUser, requireOrgAdminOrSuper)

function resolveOrgId(req) {
  if (req.appUser.role === 'SUPER_ADMIN') {
    return req.params.orgId
  }
  return req.appUser.organizationId
}

router.get('/', async (req, res, next) => {
  try {
    const organizationId = resolveOrgId(req)
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    if (req.appUser.role === 'ORG_ADMIN' && req.appUser.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot access another organization' })
    }

    const departments = await prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    })

    res.json({ departments })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const organizationId = resolveOrgId(req)
    const { name } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Department name is required' })
    }

    if (req.appUser.role === 'ORG_ADMIN' && req.appUser.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot modify another organization' })
    }

    const department = await prisma.department.create({
      data: { name: name.trim(), organizationId },
    })

    res.status(201).json({ department })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Department name already exists in this organization' })
    }
    next(err)
  }
})

router.delete('/:departmentId', async (req, res, next) => {
  try {
    const organizationId = resolveOrgId(req)
    const department = await prisma.department.findFirst({
      where: { id: req.params.departmentId, organizationId },
    })

    if (!department) {
      return res.status(404).json({ error: 'Department not found' })
    }

    if (req.appUser.role === 'ORG_ADMIN' && req.appUser.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot modify another organization' })
    }

    await prisma.department.delete({ where: { id: department.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
