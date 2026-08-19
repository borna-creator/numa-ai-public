import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireSuperAdmin } from '../middleware/auth.js'
import { createAuthUser, slugify, deleteAuthUser, isAuthProvisioningError } from '../services/users.js'
import { parseRequiredUserProfile } from '../../shared/userProfile.js'
import { getOrgUsageMinutes } from '../services/usage.js'

const router = Router()
const superAdmin = [requireSession, loadAppUser, requireSuperAdmin]

async function attachUsageStats(organizations) {
  const ids = organizations.map((o) => o.id)
  if (ids.length === 0) return organizations

  const grouped = await prisma.call.groupBy({
    by: ['organizationId'],
    where: { organizationId: { in: ids }, durationSec: { not: null } },
    _sum: { durationSec: true },
  })

  const usedByOrg = new Map(
    grouped.map((row) => [row.organizationId, Math.ceil((row._sum.durationSec ?? 0) / 60)]),
  )

  return organizations.map((org) => ({
    ...org,
    usageMinutesUsed: usedByOrg.get(org.id) ?? 0,
  }))
}

router.get('/', ...superAdmin, async (_req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { departments: true, users: true } },
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { id: true, email: true, fullName: true, jobTitle: true, createdAt: true },
        },
      },
    })
    res.json({ organizations: await attachUsageStats(organizations) })
  } catch (err) {
    next(err)
  }
})

router.post('/', ...superAdmin, async (req, res, next) => {
  try {
    const { name, slug, adminEmail, adminPassword, adminFullName, adminJobTitle } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Organization name is required' })
    }
    if (!adminEmail?.trim() || !adminPassword?.trim()) {
      return res.status(400).json({ error: 'Org admin email and password are required' })
    }
    if (adminPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    let adminProfile
    try {
      adminProfile = parseRequiredUserProfile(adminFullName, adminJobTitle)
    } catch (err) {
      return res.status(400).json({ error: err.message })
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
          ...adminProfile,
          role: 'ORG_ADMIN',
          organizationId: org.id,
        },
      })

      return org
    })

    const result = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { id: true, email: true, fullName: true, jobTitle: true, createdAt: true },
        },
        _count: { select: { departments: true, users: true } },
      },
    })

    res.status(201).json({ organization: result })
  } catch (err) {
    if (isAuthProvisioningError(err)) {
      return res.status(409).json({ error: err.message })
    }
    next(err)
  }
})

router.get('/:orgId', ...superAdmin, async (req, res, next) => {
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

    const usageMinutesUsed = await getOrgUsageMinutes(organization.id)
    res.json({ organization: { ...organization, usageMinutesUsed } })
  } catch (err) {
    next(err)
  }
})

router.patch('/:orgId', ...superAdmin, async (req, res, next) => {
  try {
    const { name, slug, usageMinutesCap } = req.body
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

    if (usageMinutesCap !== undefined) {
      if (usageMinutesCap === null || usageMinutesCap === '') {
        data.usageMinutesCap = null
      } else {
        const cap = Number(usageMinutesCap)
        if (!Number.isFinite(cap) || cap < 0) {
          return res.status(400).json({ error: 'usageMinutesCap must be a non-negative number or null' })
        }
        data.usageMinutesCap = Math.round(cap)
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const updated = await prisma.organization.update({
      where: { id: organization.id },
      data,
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { id: true, email: true, fullName: true, jobTitle: true, createdAt: true },
        },
        _count: { select: { departments: true, users: true } },
      },
    })

    const usageMinutesUsed = await getOrgUsageMinutes(updated.id)
    res.json({ organization: { ...updated, usageMinutesUsed } })
  } catch (err) {
    next(err)
  }
})

router.delete('/:orgId', ...superAdmin, async (req, res, next) => {
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
