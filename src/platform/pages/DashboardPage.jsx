import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PlatformLayout from '../components/PlatformLayout.jsx'
import SuperAdminPage from './super-admin/SuperAdminPage.jsx'
import OrgDashboardPage from './org-admin/OrgDashboardPage.jsx'

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
        <OrgDashboardPage orgId={user.organizationId} />
      </PlatformLayout>
    )
  }

  if (user?.role === 'USER') {
    return (
      <PlatformLayout title="Dashboard">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
          <p className="text-slate-600">
            Welcome, {user.email}. Call scoring features are coming soon.
          </p>
          {user.department && (
            <p className="text-sm text-slate-500 mt-2">Department: {user.department.name}</p>
          )}
        </div>
      </PlatformLayout>
    )
  }

  return <Navigate to="/platform/login" replace />
}
