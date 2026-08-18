import { useState } from 'react'
import { Tabs } from '../../components/Tabs.jsx'
import UserManagementTab from './UserManagementTab.jsx'
import QaPlatformTab from '../qa/QaPlatformTab.jsx'
import { Card } from '../../components/ui.jsx'

const SUPER_ADMIN_TABS = [
  { id: 'user-management', label: 'User Management' },
  { id: 'qa', label: 'QA Platform' },
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
    </div>
  )
}
