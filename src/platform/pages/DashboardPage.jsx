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
      <PlatformLayout
        title="Super Admin"
        subtitle="Manage organizations, teams, and QA operations across the platform."
      >
        <SuperAdminPage />
      </PlatformLayout>
    )
  }

  if (user?.role === 'ORG_ADMIN') {
    return (
      <PlatformLayout
        title={user.organization?.name || 'Organization'}
        subtitle="Configure scorecards, review calls, and manage your team."
      >
        <OrgAdminPage orgId={user.organizationId ?? user.organization?.id} />
      </PlatformLayout>
    )
  }

  if (user?.role === 'USER') {
    return (
      <PlatformLayout
        title="Call QA"
        subtitle="Upload recordings, track scoring progress, and review AI-generated results."
      >
        <UserQaPage />
      </PlatformLayout>
    )
  }

  return <Navigate to="/platform/login" replace />
}
