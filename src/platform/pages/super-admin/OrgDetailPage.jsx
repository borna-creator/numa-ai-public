import { Navigate, useParams } from 'react-router-dom'

/** Legacy route — redirects to User Management with org pre-selected. */
export default function OrgDetailPage() {
  const { orgId } = useParams()
  return <Navigate to={`/platform/admin?org=${orgId}`} replace />
}
