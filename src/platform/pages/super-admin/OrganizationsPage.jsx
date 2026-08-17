import { useEffect, useState } from 'react'
import { api } from '../../api.js'

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    adminEmail: '',
    adminPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await api('/api/organizations')
      setOrganizations(data.organizations)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await api('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ name: '', slug: '', adminEmail: '', adminPassword: '' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Create organization</h2>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
          <input
            placeholder="Organization name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          />
          <input
            placeholder="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          />
          <input
            type="email"
            placeholder="Org admin email"
            required
            value={form.adminEmail}
            onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          />
          <input
            type="password"
            placeholder="Org admin password (min 8 chars)"
            required
            minLength={8}
            value={form.adminPassword}
            onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          />
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create organization'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Organizations</h2>
        </div>
        {loading ? (
          <p className="p-6 text-slate-500 text-sm">Loading…</p>
        ) : organizations.length === 0 ? (
          <p className="p-6 text-slate-500 text-sm">No organizations yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {organizations.map((org) => (
              <div key={org.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{org.name}</p>
                  <p className="text-sm text-slate-500">
                    {org.slug} · {org._count.departments} departments · {org._count.users} users
                  </p>
                  {org.users[0] && (
                    <p className="text-sm text-numa-600 mt-1">Admin: {org.users[0].email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
