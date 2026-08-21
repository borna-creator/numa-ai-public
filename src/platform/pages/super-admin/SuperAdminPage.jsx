import { lazy, Suspense, useState } from 'react'
import { Tabs } from '../../components/Tabs.jsx'
import UserManagementTab from './UserManagementTab.jsx'
import QaPlatformTab from '../qa/QaPlatformTab.jsx'
import { Card, LoadingState } from '../../components/ui.jsx'

const VoiceAgentTab = lazy(() => import('./VoiceAgentTab.jsx'))

const SUPER_ADMIN_TABS = [
  { id: 'user-management', label: 'User Management' },
  { id: 'qa', label: 'QA Platform' },
  { id: 'voice', label: 'Voice Assistant' },
]

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState('user-management')

  return (
    <div className="space-y-6">
      <Card className="!p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs tabs={SUPER_ADMIN_TABS} active={activeTab} onChange={setActiveTab} />
      </Card>
      {activeTab === 'user-management' && <UserManagementTab />}
      {activeTab === 'qa' && <QaPlatformTab canManageScorecards />}
      {activeTab === 'voice' && (
        <Suspense fallback={<LoadingState label="Loading voice assistant…" />}>
          <VoiceAgentTab />
        </Suspense>
      )}
    </div>
  )
}
