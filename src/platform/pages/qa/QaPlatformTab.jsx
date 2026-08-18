import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api.js'
import { Tabs } from '../../components/Tabs.jsx'
import { getOrgApiBase } from '../../orgApi.js'
import { Alert, Card, CardHeader, EmptyState, IconBuilding, LoadingState, Select } from '../../components/ui.jsx'
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

  const apiBase = selectedOrgId
    ? getOrgApiBase({ role: 'SUPER_ADMIN', orgId: selectedOrgId })
    : null

  if (loading) {
    return <LoadingState label="Loading organizations…" />
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader
          title="Organization context"
          description="Choose which organization's calls and scorecards to review."
        />
        <Select
          label="Organization"
          id="qa-org-select"
          value={selectedOrgId}
          onChange={(e) => selectOrg(e.target.value)}
          disabled={organizations.length === 0}
          className="max-w-xl"
        >
          {organizations.length === 0 ? (
            <option value="">No organizations</option>
          ) : (
            organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))
          )}
        </Select>
      </Card>

      {selectedOrgId && apiBase ? (
        <div className="space-y-4">
          <Card className="!p-4">
            <Tabs tabs={QA_TABS} active={activeTab} onChange={setActiveTab} />
          </Card>
          {activeTab === 'calls' && <CallsPanel apiBase={apiBase} canDeleteAny />}
          {activeTab === 'scorecards' && (
            <ScorecardsPanel apiBase={apiBase} canManage={canManageScorecards} />
          )}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={IconBuilding}
            title="No organization selected"
            description="Create an organization under User Management first, then return here to manage QA."
          />
        </Card>
      )}
    </div>
  )
}
