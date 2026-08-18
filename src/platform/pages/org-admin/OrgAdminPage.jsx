import { useState } from 'react'
import { Tabs } from '../../components/Tabs.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getOrgApiBase } from '../../orgApi.js'
import { Card } from '../../components/ui.jsx'
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
  const apiBase = getOrgApiBase({ role: user?.role, orgId: orgId ?? user?.organizationId })

  return (
    <div className="space-y-6">
      <Card className="!p-4">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </Card>
      {activeTab === 'team' && (
        <OrgDashboardPage orgId={orgId ?? user?.organizationId} apiBase={apiBase} />
      )}
      {activeTab === 'scorecards' && <ScorecardsPanel apiBase={apiBase} canManage />}
      {activeTab === 'calls' && (
        <CallsPanel apiBase={apiBase} canDeleteAny currentUserId={user?.id} />
      )}
    </div>
  )
}
