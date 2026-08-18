export function resolveOrgId(req) {
  if (req.appUser.role === 'SUPER_ADMIN') {
    return req.params.orgId
  }
  return req.appUser.organizationId
}

export function requireOrgContext(req, res, next) {
  if (req.appUser.role === 'SUPER_ADMIN') {
    const organizationId = req.params.orgId
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' })
    }
    req.organizationId = organizationId
    return next()
  }

  const organizationId = req.appUser.organizationId
  if (!organizationId) {
    return res.status(403).json({ error: 'Your account is not assigned to an organization' })
  }

  // Org members always operate on their own org — ignore any :orgId in the URL.
  req.organizationId = organizationId
  req.params.orgId = organizationId
  next()
}

/** For /api/org/* routes — sets org from the logged-in member (not super admin). */
export function attachMemberOrg(req, res, next) {
  if (req.appUser.role === 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admins must use /api/organizations/:orgId routes' })
  }
  return requireOrgContext(req, res, next)
}
