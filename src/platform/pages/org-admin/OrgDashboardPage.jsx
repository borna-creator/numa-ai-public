import { useEffect, useState } from 'react'
import { api } from '../../api.js'

export default function OrgDashboardPage({ orgId }) {
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [deptName, setDeptName] = useState('')
  const [userForm, setUserForm] = useState({ email: '', password: '', departmentId: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const [deptData, userData] = await Promise.all([
        api(`/api/organizations/${orgId}/departments`),
        api(`/api/organizations/${orgId}/users`),
      ])
      setDepartments(deptData.departments)
      setUsers(userData.users)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [orgId])

  const createDepartment = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api(`/api/organizations/${orgId}/departments`, {
        method: 'POST',
        body: JSON.stringify({ name: deptName }),
      })
      setDeptName('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const createUser = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api(`/api/organizations/${orgId}/users`, {
        method: 'POST',
        body: JSON.stringify(userForm),
      })
      setUserForm({ email: '', password: '', departmentId: '' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading…</p>
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Departments</h2>
        <form onSubmit={createDepartment} className="flex gap-3 mb-4">
          <input
            placeholder="Department name"
            required
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          />
          <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700">
            Add
          </button>
        </form>
        {departments.length === 0 ? (
          <p className="text-sm text-slate-500">No departments yet. Create one before adding users.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {departments.map((d) => (
              <li key={d.id} className="px-4 py-3 flex justify-between text-sm">
                <span className="font-medium text-slate-900">{d.name}</span>
                <span className="text-slate-500">{d._count.users} users</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Users</h2>
        <form onSubmit={createUser} className="grid sm:grid-cols-2 gap-3 mb-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            required
            minLength={8}
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          />
          <select
            required
            value={userForm.departmentId}
            onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
            className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={departments.length === 0}
            className="sm:col-span-2 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700 disabled:opacity-50"
          >
            Create user
          </button>
        </form>
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">No users yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {users.map((u) => (
              <li key={u.id} className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                <span className="font-medium text-slate-900">{u.email}</span>
                <span className="text-slate-500">{u.department?.name || '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
