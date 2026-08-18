export function resolveOrgId(req) {
  if (req.appUser.role === 'SUPER_ADMIN') {
    return req.params.orgId
  }
  return req.appUser.organizationId
}

export function requireOrgContext(req, res, next) {
  const organizationId = resolveOrgId(req)

  if (!organizationId) {
    return res.status(400).json({ error: 'Organization context required' })
  }

  if (req.appUser.role !== 'SUPER_ADMIN' && req.appUser.organizationId !== organizationId) {
    return res.status(403).json({ error: 'Cannot access another organization' })
  }

  req.organizationId = organizationId
  next()
}
