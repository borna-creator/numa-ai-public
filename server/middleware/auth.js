import { verifySession } from 'supertokens-node/recipe/session/framework/express/index.js'
import { prisma } from '../db.js'

export const requireSession = verifySession()

export async function loadAppUser(req, res, next) {
  try {
    const superTokensUserId = req.session.getUserId()
    const appUser = await prisma.user.findUnique({
      where: { superTokensUserId },
      include: {
        organization: true,
        department: true,
      },
    })

    if (!appUser) {
      return res.status(403).json({ error: 'Account not provisioned. Contact your administrator.' })
    }

    req.appUser = appUser
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.appUser) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    if (!roles.includes(req.appUser.role)) {
      return res.status(403).json({
        error: `Insufficient permissions. Required: ${roles.join(' or ')}. Your role: ${req.appUser.role}`,
      })
    }
    next()
  }
}

export const requireSuperAdmin = requireRoles('SUPER_ADMIN')
export const requireOrgAdmin = requireRoles('ORG_ADMIN')
export const requireOrgAdminOrSuper = requireRoles('ORG_ADMIN', 'SUPER_ADMIN')
