import { useAuth } from '../context/AuthContext.jsx'
import CallsPanel from './qa/CallsPanel.jsx'

export default function UserQaPage() {
  const { user } = useAuth()

  if (!user?.organizationId) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-600">
        Your account is not assigned to an organization yet.
      </div>
    )
  }

  return (
    <CallsPanel
      orgId={user.organizationId}
      userDepartmentId={user.departmentId}
      currentUserId={user.id}
    />
  )
}
