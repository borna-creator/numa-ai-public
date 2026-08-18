/** API base path for org-scoped resources (scorecards, calls, departments). */
export function getOrgApiBase({ role, orgId }) {
  if (role === 'SUPER_ADMIN' && orgId) {
    return `/api/organizations/${orgId}`
  }
  return '/api/org'
}
