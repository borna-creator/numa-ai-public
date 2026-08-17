import { Tabs } from '../../components/Tabs.jsx'
import UserManagementTab from './UserManagementTab.jsx'

const SUPER_ADMIN_TABS = [{ id: 'user-management', label: 'User Management' }]

export default function SuperAdminPage() {
  return (
    <div className="space-y-6">
      <Tabs tabs={SUPER_ADMIN_TABS} active="user-management" onChange={() => {}} />
      <UserManagementTab />
    </div>
  )
}
