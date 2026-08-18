import { useAuth } from '../../context/AuthContext.jsx'
import { getOrgApiBase } from '../../orgApi.js'
import { Card, EmptyState, IconBuilding } from '../../components/ui.jsx'
import CallsPanel from './CallsPanel.jsx'

export default function UserQaPage() {
  const { user } = useAuth()
  const apiBase = getOrgApiBase({ role: user?.role, orgId: user?.organizationId })

  if (!user?.organizationId) {
    return (
      <Card>
        <EmptyState
          icon={IconBuilding}
          title="No organization assigned"
          description="Your account is not linked to an organization yet. Contact your administrator."
        />
      </Card>
    )
  }

  return <CallsPanel apiBase={apiBase} userDepartmentId={user.departmentId} currentUserId={user.id} />
}
