import { useEffect, useState } from 'react'
import { Tabs } from '../../components/Tabs.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getOrgApiBase } from '../../orgApi.js'
import { api } from '../../api.js'
import { Card } from '../../components/ui.jsx'
import UsageLimitsCard from '../../components/UsageLimitsCard.jsx'
import OrgDashboardPage from '../org-admin/OrgDashboardPage.jsx'
import ScorecardsPanel from '../qa/ScorecardsPanel.jsx'
import CallsPanel from '../qa/CallsPanel.jsx'

const TABS = [
  { id: 'calls', label: 'Calls' },
  { id: 'scorecards', label: 'Scorecards' },
  { id: 'team', label: 'Team' },
]

export default function OrgAdminPage({ orgId }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('calls')
  const [usageData, setUsageData] = useState(null)
  const apiBase = getOrgApiBase({ role: user?.role, orgId: orgId ?? user?.organizationId })

  useEffect(() => {
    if (user?.role !== 'ORG_ADMIN') return

    api('/api/org/usage')
      .then((data) => setUsageData(data))
      .catch(() => setUsageData(null))
  }, [user?.role])

  return (
    <div className="space-y-6">
      {user?.role === 'ORG_ADMIN' && usageData?.usage && (
        <UsageLimitsCard
          usage={usageData.usage}
          limits={usageData.organization}
          title={`${usageData.organization?.name ?? 'Organization'} usage`}
        />
      )}

      <Card className="!p-4">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </Card>
      {activeTab === 'team' && (
        <OrgDashboardPage orgId={orgId ?? user?.organizationId} apiBase={apiBase} />
      )}
      {activeTab === 'scorecards' && <ScorecardsPanel apiBase={apiBase} canManage />}
      {activeTab === 'calls' && (
        <CallsPanel
          apiBase={apiBase}
          canDeleteAny
          showUsageBanner={false}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}
