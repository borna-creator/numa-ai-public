import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api.js'
import PlatformLayout from '../../components/PlatformLayout.jsx'
import OrgDashboardPage from '../org-admin/OrgDashboardPage.jsx'

export default function OrgDetailPage() {
  const { orgId } = useParams()
  const navigate = useNavigate()

  const handleDeleteOrg = async () => {
    if (!window.confirm('Delete this organization and all its users? This cannot be undone.')) return
    try {
      await api(`/api/organizations/${orgId}`, { method: 'DELETE' })
      navigate('/platform/admin')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <PlatformLayout title="Manage organization">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to="/platform/admin" className="text-sm text-numa-600 hover:underline">
          ← Back to organizations
        </Link>
        <button
          type="button"
          onClick={handleDeleteOrg}
          className="text-sm font-semibold text-red-600 hover:text-red-700"
        >
          Delete organization
        </button>
      </div>
      <OrgDashboardPage orgId={orgId} mode="super-admin" />
    </PlatformLayout>
  )
}
