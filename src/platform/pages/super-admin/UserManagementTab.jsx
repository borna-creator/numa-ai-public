import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import { Tabs } from '../../components/Tabs.jsx'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconBuilding,
  Input,
  LoadingState,
  PageIntro,
  Select,
} from '../../components/ui.jsx'
import OrgDashboardPage from '../org-admin/OrgDashboardPage.jsx'

const ONBOARDING_TABS = [
  { id: 'organization', label: 'Organization' },
  { id: 'departments', label: 'Departments' },
  { id: 'users', label: 'Users' },
]

export default function UserManagementTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeSection, setActiveSection] = useState('organization')
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    adminFullName: '',
    adminJobTitle: '',
    adminEmail: '',
    adminPassword: '',
  })

  const selectedOrgId = searchParams.get('org') || ''

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api('/api/organizations')
      setOrganizations(data.organizations)
      return data.organizations
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  useEffect(() => {
    if (loading || selectedOrgId || organizations.length === 0) return
    setSearchParams({ org: organizations[0].id }, { replace: true })
  }, [loading, organizations, selectedOrgId, setSearchParams])

  const selectOrg = (orgId) => {
    setSearchParams(orgId ? { org: orgId } : {})
    setActiveSection('organization')
  }

  const handleCreateOrg = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { organization } = await api('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      setCreateForm({
        name: '',
        slug: '',
        adminFullName: '',
        adminJobTitle: '',
        adminEmail: '',
        adminPassword: '',
      })
      setShowCreateForm(false)
      await loadOrganizations()
      setSearchParams({ org: organization.id })
      setActiveSection('departments')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!selectedOrgId) return
    const org = organizations.find((o) => o.id === selectedOrgId)
    if (!window.confirm(`Delete "${org?.name}" and all its users? This cannot be undone.`)) return
    setError('')
    try {
      await api(`/api/organizations/${selectedOrgId}`, { method: 'DELETE' })
      const remaining = await loadOrganizations()
      setSearchParams(remaining[0] ? { org: remaining[0].id } : {})
    } catch (err) {
      setError(err.message)
    }
  }

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId)

  const tabsWithCounts = ONBOARDING_TABS.map((tab) => {
    if (tab.id === 'departments') return { ...tab, count: selectedOrg?._count.departments }
    if (tab.id === 'users') return { ...tab, count: selectedOrg?._count.users }
    return tab
  })

  if (loading) {
    return <LoadingState label="Loading organizations…" />
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <PageIntro
        title="Organizations"
        description="Create and configure customer organizations, departments, and user accounts."
        action={
          <Button onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? 'Cancel' : '+ New organization'}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <Select
            label="Active organization"
            id="org-select"
            value={selectedOrgId}
            onChange={(e) => selectOrg(e.target.value)}
            disabled={organizations.length === 0}
            className="flex-1"
          >
            {organizations.length === 0 ? (
              <option value="">No organizations yet</option>
            ) : (
              organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} · {org._count.departments} depts · {org._count.users} users
                </option>
              ))
            )}
          </Select>
          {selectedOrg && (
            <Button variant="danger" onClick={handleDeleteOrg} className="shrink-0">
              Delete organization
            </Button>
          )}
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateOrg} className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
            <p className="sm:col-span-2 text-sm font-semibold text-slate-900">Create organization & org admin</p>
            <Input
              placeholder="Organization name"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
            <Input
              placeholder="Slug (optional)"
              value={createForm.slug}
              onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
            />
            <Input
              placeholder="Org admin full name"
              required
              value={createForm.adminFullName}
              onChange={(e) => setCreateForm({ ...createForm, adminFullName: e.target.value })}
            />
            <Input
              placeholder="Org admin role"
              required
              value={createForm.adminJobTitle}
              onChange={(e) => setCreateForm({ ...createForm, adminJobTitle: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Org admin email"
              required
              value={createForm.adminEmail}
              onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password (min 8 chars)"
              required
              minLength={8}
              value={createForm.adminPassword}
              onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
            />
            <Button type="submit" disabled={submitting} className="sm:col-span-2 w-full sm:w-auto">
              {submitting ? 'Creating…' : 'Create & continue to departments'}
            </Button>
          </form>
        )}
      </Card>

      {selectedOrgId ? (
        <div className="space-y-4">
          <Card className="!p-4">
            <Tabs tabs={tabsWithCounts} active={activeSection} onChange={setActiveSection} />
          </Card>
          <OrgDashboardPage
            key={selectedOrgId}
            orgId={selectedOrgId}
            mode="super-admin"
            activeSection={activeSection}
            onOrgUpdated={loadOrganizations}
          />
        </div>
      ) : (
        !loading &&
        organizations.length === 0 && (
          <Card>
            <EmptyState
              icon={IconBuilding}
              title="No organizations yet"
              description="Create your first organization to start onboarding departments and users."
              action={<Button onClick={() => setShowCreateForm(true)}>+ New organization</Button>}
            />
          </Card>
        )
      )}
    </div>
  )
}
