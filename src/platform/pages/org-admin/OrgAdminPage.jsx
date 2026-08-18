import { useState } from 'react'
import { Tabs } from '../../components/Tabs.jsx'
import OrgDashboardPage from '../org-admin/OrgDashboardPage.jsx'
import ScorecardsPanel from '../qa/ScorecardsPanel.jsx'
import CallsPanel from '../qa/CallsPanel.jsx'

const TABS = [
  { id: 'team', label: 'Team' },
  { id: 'scorecards', label: 'Scorecards' },
  { id: 'calls', label: 'Calls' },
]

export default function OrgAdminPage({ orgId }) {
  const [activeTab, setActiveTab] = useState('calls')

  return (
    <div className="space-y-6">
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'team' && <OrgDashboardPage orgId={orgId} />}
      {activeTab === 'scorecards' && <ScorecardsPanel orgId={orgId} canManage />}
      {activeTab === 'calls' && <CallsPanel orgId={orgId} canDeleteAny />}
    </div>
  )
}
