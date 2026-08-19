import { Router } from 'express'
import { prisma } from '../db.js'
import { requireSession, loadAppUser, requireOrgAdmin } from '../middleware/auth.js'
import { attachMemberOrg } from '../middleware/orgAccess.js'
import { getOrgUsageSummary } from '../services/usage.js'

const router = Router()

router.use(requireSession, loadAppUser, attachMemberOrg, requireOrgAdmin)

router.get('/', async (req, res, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.organizationId },
      select: {
        name: true,
        usageMinutesCap: true,
        usageMinutesMonthlyCap: true,
        usageResetDayOfMonth: true,
      },
    })

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' })
    }

    const usage = await getOrgUsageSummary(req.organizationId)
    res.json({ organization, usage })
  } catch (err) {
    next(err)
  }
})

export default router
