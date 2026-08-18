import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import { Tabs } from '../../components/Tabs.jsx'
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="org-select" className="block text-sm font-medium text-slate-700 mb-1.5">
              Organization
            </label>
            <select
              id="org-select"
              value={selectedOrgId}
              onChange={(e) => selectOrg(e.target.value)}
              disabled={loading || organizations.length === 0}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30 bg-white"
            >
              {organizations.length === 0 ? (
                <option value="">No organizations yet</option>
              ) : (
                organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org._count.departments} depts · {org._count.users} users)
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-numa-600 hover:bg-numa-700"
            >
              {showCreateForm ? 'Cancel' : '+ New organization'}
            </button>
            {selectedOrg && (
              <button
                type="button"
                onClick={handleDeleteOrg}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50"
              >
                Delete org
              </button>
            )}
          </div>
        </div>

        {selectedOrg && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ONBOARDING_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeSection === tab.id
                    ? 'bg-numa-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.id === 'organization' && '1. Organization'}
                {tab.id === 'departments' && `2. Departments (${selectedOrg._count.departments})`}
                {tab.id === 'users' && `3. Users (${selectedOrg._count.users})`}
              </button>
            ))}
          </div>
        )}

        {showCreateForm && (
          <form onSubmit={handleCreateOrg} className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
            <p className="sm:col-span-2 text-sm font-medium text-slate-900">Create organization & org admin</p>
            <input
              placeholder="Organization name"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <input
              placeholder="Slug (optional)"
              value={createForm.slug}
              onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <input
              placeholder="Org admin full name"
              required
              value={createForm.adminFullName}
              onChange={(e) => setCreateForm({ ...createForm, adminFullName: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <input
              placeholder="Org admin role (e.g. Operations Manager)"
              required
              value={createForm.adminJobTitle}
              onChange={(e) => setCreateForm({ ...createForm, adminJobTitle: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <input
              type="email"
              placeholder="Org admin email"
              required
              value={createForm.adminEmail}
              onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <input
              type="password"
              placeholder="Org admin password (min 8 chars)"
              required
              minLength={8}
              value={createForm.adminPassword}
              onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700 disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'Create & continue to departments'}
            </button>
          </form>
        )}
      </section>

      {selectedOrgId ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="px-6 pt-4">
            <Tabs tabs={ONBOARDING_TABS} active={activeSection} onChange={setActiveSection} />
          </div>
          <div className="p-6">
            <OrgDashboardPage
              key={selectedOrgId}
              orgId={selectedOrgId}
              mode="super-admin"
              activeSection={activeSection}
              onOrgUpdated={loadOrganizations}
            />
          </div>
        </section>
      ) : (
        !loading &&
        organizations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600 mb-2">No organizations yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Create your first organization to start onboarding departments and users.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-numa-600 hover:bg-numa-700"
            >
              + New organization
            </button>
          </div>
        )
      )}
    </div>
  )
}
