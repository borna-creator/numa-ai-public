import { useAuth } from '../../context/AuthContext.jsx'
import { getOrgApiBase } from '../../orgApi.js'
import CallsPanel from './CallsPanel.jsx'

export default function UserQaPage() {
  const { user } = useAuth()
  const apiBase = getOrgApiBase({ role: user?.role, orgId: user?.organizationId })

  if (!user?.organizationId) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-600">
        Your account is not assigned to an organization yet.
      </div>
    )
  }

  return (
    <CallsPanel
      apiBase={apiBase}
      userDepartmentId={user.departmentId}
      currentUserId={user.id}
    />
  )
}
