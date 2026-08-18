import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import { Tabs } from '../../components/Tabs.jsx'
import { getOrgApiBase } from '../../orgApi.js'
import ScorecardsPanel from './ScorecardsPanel.jsx'
import CallsPanel from './CallsPanel.jsx'

const QA_TABS = [
  { id: 'calls', label: 'Calls' },
  { id: 'scorecards', label: 'Scorecards' },
]

export default function QaPlatformTab({ canManageScorecards = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('calls')

  const orgFromQuery = searchParams.get('qaOrg') || ''
  const selectedOrgId = orgFromQuery

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
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('qaOrg', organizations[0].id)
        return next
      },
      { replace: true },
    )
  }, [loading, organizations, selectedOrgId, setSearchParams])

  const selectOrg = (orgId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (orgId) next.set('qaOrg', orgId)
      else next.delete('qaOrg')
      return next
    })
  }

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId)
  const apiBase = selectedOrgId
    ? getOrgApiBase({ role: 'SUPER_ADMIN', orgId: selectedOrgId })
    : null

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading organizations…</p>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <label htmlFor="qa-org-select" className="block text-sm font-medium text-slate-700 mb-1.5">
          Organization
        </label>
        <select
          id="qa-org-select"
          value={selectedOrgId}
          onChange={(e) => selectOrg(e.target.value)}
          disabled={organizations.length === 0}
          className="w-full max-w-xl px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30 bg-white"
        >
          {organizations.length === 0 ? (
            <option value="">No organizations</option>
          ) : (
            organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))
          )}
        </select>
      </section>

      {selectedOrgId && apiBase ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="px-6 pt-4">
            <Tabs tabs={QA_TABS} active={activeTab} onChange={setActiveTab} />
          </div>
          <div className="p-6">
            {activeTab === 'calls' && (
              <CallsPanel apiBase={apiBase} canDeleteAny />
            )}
            {activeTab === 'scorecards' && (
              <ScorecardsPanel apiBase={apiBase} canManage={canManageScorecards} />
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Create an organization under User Management first.
        </div>
      )}
    </div>
  )
}
