import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireSuperAdmin } from '../middleware/auth.js'
import { createAuthUser, slugify, deleteAuthUser } from '../services/users.js'

const router = Router()

router.use(requireSession, loadAppUser, requireSuperAdmin)

router.get('/', async (_req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { departments: true, users: true } },
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { id: true, email: true, createdAt: true },
        },
      },
    })
    res.json({ organizations })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, slug, adminEmail, adminPassword } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Organization name is required' })
    }
    if (!adminEmail?.trim() || !adminPassword?.trim()) {
      return res.status(400).json({ error: 'Org admin email and password are required' })
    }
    if (adminPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const orgSlug = slug?.trim() || slugify(name)
    const existingOrg = await prisma.organization.findUnique({ where: { slug: orgSlug } })
    if (existingOrg) {
      return res.status(409).json({ error: 'Organization slug already exists' })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: adminEmail.trim().toLowerCase() } })
    if (existingEmail) {
      return res.status(409).json({ error: 'Admin email already in use' })
    }

    const superTokensUserId = await createAuthUser(adminEmail.trim().toLowerCase(), adminPassword)

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: name.trim(), slug: orgSlug },
      })

      await tx.user.create({
        data: {
          email: adminEmail.trim().toLowerCase(),
          superTokensUserId,
          role: 'ORG_ADMIN',
          organizationId: org.id,
        },
      })

      return org
    })

    const result = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        users: { where: { role: 'ORG_ADMIN' }, select: { id: true, email: true, createdAt: true } },
        _count: { select: { departments: true, users: true } },
      },
    })

    res.status(201).json({ organization: result })
  } catch (err) {
    next(err)
  }
})

router.get('/:orgId', async (req, res, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.params.orgId },
      include: {
        departments: { orderBy: { name: 'asc' } },
        users: {
          orderBy: { email: 'asc' },
          include: { department: { select: { id: true, name: true } } },
        },
      },
    })

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    res.json({ organization })
  } catch (err) {
    next(err)
  }
})

router.patch('/:orgId', async (req, res, next) => {
  try {
    const { name, slug } = req.body
    const organization = await prisma.organization.findUnique({ where: { id: req.params.orgId } })

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    const data = {}
    if (name !== undefined) {
      if (!name?.trim()) {
        return res.status(400).json({ error: 'Organization name cannot be empty' })
      }
      data.name = name.trim()
    }
    if (slug !== undefined) {
      const orgSlug = slug?.trim() || slugify(data.name || organization.name)
      if (!orgSlug) {
        return res.status(400).json({ error: 'Organization slug cannot be empty' })
      }
      const existingOrg = await prisma.organization.findFirst({
        where: { slug: orgSlug, NOT: { id: organization.id } },
      })
      if (existingOrg) {
        return res.status(409).json({ error: 'Organization slug already exists' })
      }
      data.slug = orgSlug
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const updated = await prisma.organization.update({
      where: { id: organization.id },
      data,
      include: {
        users: { where: { role: 'ORG_ADMIN' }, select: { id: true, email: true, createdAt: true } },
        _count: { select: { departments: true, users: true } },
      },
    })

    res.json({ organization: updated })
  } catch (err) {
    next(err)
  }
})

router.delete('/:orgId', async (req, res, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.params.orgId },
      include: { users: true },
    })

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    for (const user of organization.users) {
      try {
        await deleteAuthUser(user.superTokensUserId)
      } catch (err) {
        console.error(`Failed to delete auth user ${user.email}:`, err.message)
      }
    }

    await prisma.organization.delete({ where: { id: organization.id } })
    res.status(204).send()
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Organization not found' })
    }
    next(err)
  }
})

export default router
