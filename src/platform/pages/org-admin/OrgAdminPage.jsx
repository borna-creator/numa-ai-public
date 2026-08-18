import { useState } from 'react'
import { Tabs } from '../../components/Tabs.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getOrgApiBase } from '../../orgApi.js'
import OrgDashboardPage from '../org-admin/OrgDashboardPage.jsx'
import ScorecardsPanel from '../qa/ScorecardsPanel.jsx'
import CallsPanel from '../qa/CallsPanel.jsx'

const TABS = [
  { id: 'team', label: 'Team' },
  { id: 'scorecards', label: 'Scorecards' },
  { id: 'calls', label: 'Calls' },
]

export default function OrgAdminPage({ orgId }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('calls')
  const apiBase = getOrgApiBase({ role: user?.role, orgId: orgId ?? user?.organizationId })

  return (
    <div className="space-y-6">
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'team' && <OrgDashboardPage orgId={orgId ?? user?.organizationId} />}
      {activeTab === 'scorecards' && <ScorecardsPanel apiBase={apiBase} canManage />}
      {activeTab === 'calls' && (
        <CallsPanel apiBase={apiBase} canDeleteAny currentUserId={user?.id} />
      )}
    </div>
  )
}
