import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireOrgAdminOrSuper } from '../middleware/auth.js'
import { requireOrgContext } from '../middleware/orgAccess.js'
import {
  parseOptionalUserProfile,
  parseRequiredUserProfile,
} from '../../shared/userProfile.js'
import {
  createAuthUser,
  deleteAuthUser,
  updateAuthUserEmail,
  updateAuthUserPassword,
  isAuthProvisioningError,
} from '../services/users.js'

const router = Router({ mergeParams: true })

router.use(requireSession, loadAppUser, requireOrgContext)

function manageableRoles(req) {
  return req.appUser.role === 'SUPER_ADMIN' ? ['USER', 'ORG_ADMIN'] : ['USER']
}

router.get('/', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.organizationId, role: { in: manageableRoles(req) } },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }, { email: 'asc' }],
      include: { department: { select: { id: true, name: true } } },
    })

    res.json({ users })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const { email, password, fullName, jobTitle, departmentId, role = 'USER' } = req.body

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    let profile
    try {
      profile = parseRequiredUserProfile(fullName, jobTitle)
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }

    const targetRole = role === 'ORG_ADMIN' ? 'ORG_ADMIN' : 'USER'
    if (targetRole === 'ORG_ADMIN' && req.appUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only super admins can create org admins' })
    }
    if (targetRole === 'USER' && !departmentId) {
      return res.status(400).json({ error: 'Department is required' })
    }

    if (targetRole === 'USER') {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: req.organizationId },
      })
      if (!department) {
        return res.status(400).json({ error: 'Invalid department for this organization' })
      }
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
        ...profile,
        role: targetRole,
        organizationId: req.organizationId,
        departmentId: targetRole === 'USER' ? departmentId : null,
      },
      include: { department: { select: { id: true, name: true } } },
    })

    res.status(201).json({ user })
  } catch (err) {
    if (isAuthProvisioningError(err)) {
      return res.status(409).json({ error: err.message })
    }
    next(err)
  }
})

router.patch('/:userId', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const { email, password, fullName, jobTitle, departmentId } = req.body

    const user = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        organizationId: req.organizationId,
        role: { in: manageableRoles(req) },
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    let profileData = {}
    try {
      profileData = parseOptionalUserProfile({ fullName, jobTitle })
    } catch (err) {
      return res.status(400).json({ error: err.message })
    }

    if (
      !email?.trim() &&
      !password?.trim() &&
      departmentId === undefined &&
      Object.keys(profileData).length === 0
    ) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    if (password?.trim() && password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    if (user.role === 'USER' && departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: departmentId, organizationId: req.organizationId },
      })
      if (!department) {
        return res.status(400).json({ error: 'Invalid department for this organization' })
      }
    }

    if (user.role === 'ORG_ADMIN' && departmentId) {
      return res.status(400).json({ error: 'Org admins cannot be assigned to a department' })
    }

    const normalizedEmail = email?.trim().toLowerCase()
    if (normalizedEmail && normalizedEmail !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' })
      }
      await updateAuthUserEmail(user.superTokensUserId, normalizedEmail)
    }

    if (password?.trim()) {
      await updateAuthUserPassword(user.superTokensUserId, password)
    }

    const data = { ...profileData }
    if (normalizedEmail) data.email = normalizedEmail
    if (user.role === 'USER' && departmentId !== undefined) {
      data.departmentId = departmentId || null
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      include: { department: { select: { id: true, name: true } } },
    })

    res.json({ user: updated })
  } catch (err) {
    if (err.code === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'Email already in use' })
    }
    next(err)
  }
})

router.delete('/:userId', requireOrgAdminOrSuper, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        organizationId: req.organizationId,
        role: { in: manageableRoles(req) },
      },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    await deleteAuthUser(user.superTokensUserId)
    await prisma.user.delete({ where: { id: user.id } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
