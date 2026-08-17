import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireOrgAdminOrSuper } from '../middleware/auth.js'
import { createAuthUser } from '../services/users.js'

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

    if (req.appUser.role === 'ORG_ADMIN' && req.appUser.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot access another organization' })
    }

    const users = await prisma.user.findMany({
      where: { organizationId, role: 'USER' },
      orderBy: { email: 'asc' },
      include: { department: { select: { id: true, name: true } } },
    })

    res.json({ users })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const organizationId = resolveOrgId(req)
    const { email, password, departmentId } = req.body

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    if (!departmentId) {
      return res.status(400).json({ error: 'Department is required' })
    }

    if (req.appUser.role === 'ORG_ADMIN' && req.appUser.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot modify another organization' })
    }

    const department = await prisma.department.findFirst({
      where: { id: departmentId, organizationId },
    })
    if (!department) {
      return res.status(400).json({ error: 'Invalid department for this organization' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const superTokensUserId = await createAuthUser(normalizedEmail, password)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        superTokensUserId,
        role: 'USER',
        organizationId,
        departmentId,
      },
      include: { department: { select: { id: true, name: true } } },
    })

    res.status(201).json({ user })
  } catch (err) {
    next(err)
  }
})

router.delete('/:userId', async (req, res, next) => {
  try {
    const organizationId = resolveOrgId(req)

    const user = await prisma.user.findFirst({
      where: { id: req.params.userId, organizationId, role: 'USER' },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (req.appUser.role === 'ORG_ADMIN' && req.appUser.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Cannot modify another organization' })
    }

    await prisma.user.delete({ where: { id: user.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
