import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireOrgAdminOrSuper } from '../middleware/auth.js'
import { requireOrgContext } from '../middleware/orgAccess.js'

const router = Router({ mergeParams: true })

router.use(requireSession, loadAppUser, requireOrgContext)

router.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    })

    res.json({ departments })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const { name } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Department name is required' })
    }

    const department = await prisma.department.create({
      data: { name: name.trim(), organizationId: req.organizationId },
    })

    res.status(201).json({ department })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Department name already exists in this organization' })
    }
    next(err)
  }
})

router.patch('/:departmentId', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const { name } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Department name is required' })
    }

    const department = await prisma.department.findFirst({
      where: { id: req.params.departmentId, organizationId: req.organizationId },
    })

    if (!department) {
      return res.status(404).json({ error: 'Department not found' })
    }

    const updated = await prisma.department.update({
      where: { id: department.id },
      data: { name: name.trim() },
      include: { _count: { select: { users: true } } },
    })

    res.json({ department: updated })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Department name already exists in this organization' })
    }
    next(err)
  }
})

router.delete('/:departmentId', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const department = await prisma.department.findFirst({
      where: { id: req.params.departmentId, organizationId: req.organizationId },
    })

    if (!department) {
      return res.status(404).json({ error: 'Department not found' })
    }

    await prisma.department.delete({ where: { id: department.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
