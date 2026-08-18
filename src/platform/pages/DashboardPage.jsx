import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PlatformLayout from '../components/PlatformLayout.jsx'
import SuperAdminPage from './super-admin/SuperAdminPage.jsx'
import OrgAdminPage from './org-admin/OrgAdminPage.jsx'
import UserQaPage from './qa/UserQaPage.jsx'

export default function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <PlatformLayout title="Super Admin">
        <SuperAdminPage />
      </PlatformLayout>
    )
  }

  if (user?.role === 'ORG_ADMIN') {
    return (
      <PlatformLayout title={`${user.organization?.name || 'Organization'} Admin`}>
        <OrgAdminPage orgId={user.organizationId} />
      </PlatformLayout>
    )
  }

  if (user?.role === 'USER') {
    return (
      <PlatformLayout title="QA Platform">
        <UserQaPage />
      </PlatformLayout>
    )
  }

  return <Navigate to="/platform/login" replace />
}
