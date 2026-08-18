import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { getOrgApiBase } from '../../orgApi.js'
import { getUserDisplayName } from '../../../../shared/userProfile.js'
import {
  Alert,
  Avatar,
  Button,
  Card,
  CardHeader,
  Input,
  LoadingState,
} from '../../components/ui.jsx'

const emptyUserForm = () => ({
  fullName: '',
  jobTitle: '',
  email: '',
  password: '',
  departmentId: '',
})

const emptyAdminForm = () => ({
  fullName: '',
  jobTitle: '',
  email: '',
  password: '',
})

function UserIdentity({ user, showEmail = true }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar name={getUserDisplayName(user)} size="sm" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 truncate">{getUserDisplayName(user)}</span>
          {user.jobTitle && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {user.jobTitle}
            </span>
          )}
        </div>
        {showEmail && user.fullName && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
        )}
      </div>
    </div>
  )
}

function ProfileFields({ form, onChange, includeDepartment = false, departments = [] }) {
  return (
    <>
      <input
        placeholder="Full name"
        required
        value={form.fullName}
        onChange={(e) => onChange({ ...form, fullName: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
      />
      <input
        placeholder="Role (e.g. Agent, Team Lead)"
        required
        value={form.jobTitle}
        onChange={(e) => onChange({ ...form, jobTitle: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
      />
      <input
        type="email"
        placeholder="Email"
        required
        value={form.email}
        onChange={(e) => onChange({ ...form, email: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
      />
      <input
        type="password"
        placeholder={form.passwordOptional ? 'New password (optional)' : 'Password (min 8 chars)'}
        required={!form.passwordOptional}
        minLength={form.passwordOptional ? undefined : 8}
        value={form.password}
        onChange={(e) => onChange({ ...form, password: e.target.value })}
        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
      />
      {includeDepartment && (
        <select
          required
          value={form.departmentId}
          onChange={(e) => onChange({ ...form, departmentId: e.target.value })}
          className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      )}
    </>
  )
}

function ConfirmButton({ label, confirmMessage, onConfirm, className, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirmMessage)) onConfirm()
      }}
      className={className}
    >
      {label}
    </button>
  )
}

export default function OrgDashboardPage({
  orgId,
  apiBase: apiBaseProp,
  mode = 'org-admin',
  activeSection,
  onOrgUpdated,
}) {
  const isSuperAdmin = mode === 'super-admin'
  const apiBase = apiBaseProp ?? getOrgApiBase({ role: isSuperAdmin ? 'SUPER_ADMIN' : 'ORG_ADMIN', orgId })
  const showAll = !activeSection || activeSection === 'all'
  const showOrganization = showAll || activeSection === 'organization'
  const showDepartments = showAll || activeSection === 'departments'
  const showUsers = showAll || activeSection === 'users'
  const [organization, setOrganization] = useState(null)
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [deptName, setDeptName] = useState('')
  const [userForm, setUserForm] = useState(emptyUserForm())
  const [orgForm, setOrgForm] = useState({ name: '', slug: '' })
  const [editingDept, setEditingDept] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editUserForm, setEditUserForm] = useState({ ...emptyUserForm(), passwordOptional: true })
  const [adminForm, setAdminForm] = useState(emptyAdminForm())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const requests = [
        api(`${apiBase}/departments`),
        api(`${apiBase}/users`),
      ]
      if (isSuperAdmin) {
        requests.unshift(api(`/api/organizations/${orgId}`))
      }
      const results = await Promise.all(requests)

      if (isSuperAdmin) {
        setOrganization(results[0].organization)
        setOrgForm({ name: results[0].organization.name, slug: results[0].organization.slug })
        setDepartments(results[1].departments)
        setUsers(results[2].users)
      } else {
        setDepartments(results[0].departments)
        setUsers(results[1].users)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadOrgData() {
      try {
        setLoading(true)
        const requests = [
          api(`${apiBase}/departments`),
          api(`${apiBase}/users`),
        ]
        if (isSuperAdmin) {
          requests.unshift(api(`/api/organizations/${orgId}`))
        }
        const results = await Promise.all(requests)

        if (isSuperAdmin) {
          setOrganization(results[0].organization)
          setOrgForm({ name: results[0].organization.name, slug: results[0].organization.slug })
          setDepartments(results[1].departments)
          setUsers(results[2].users)
        } else {
          setDepartments(results[0].departments)
          setUsers(results[1].users)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrgData()
  }, [orgId, isSuperAdmin, apiBase])

  const run = async (fn) => {
    setError('')
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const runAndNotify = async (fn) => {
    await run(fn)
    onOrgUpdated?.()
  }

  const createDepartment = (e) => {
    e.preventDefault()
    run(async () => {
      await api(`${apiBase}/departments`, {
        method: 'POST',
        body: JSON.stringify({ name: deptName }),
      })
      setDeptName('')
    })
  }

  const updateDepartment = (departmentId, name) => {
    run(async () => {
      await api(`${apiBase}/departments/${departmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      setEditingDept(null)
    })
  }

  const deleteDepartment = (departmentId) => {
    run(async () => {
      await api(`${apiBase}/departments/${departmentId}`, { method: 'DELETE' })
    })
  }

  const createUser = (e) => {
    e.preventDefault()
    run(async () => {
      await api(`${apiBase}/users`, {
        method: 'POST',
        body: JSON.stringify(userForm),
      })
      setUserForm(emptyUserForm())
    })
  }

  const startEditUser = (user) => {
    setEditingUser(user.id)
    setEditUserForm({
      fullName: user.fullName || '',
      jobTitle: user.jobTitle || '',
      email: user.email,
      password: '',
      passwordOptional: true,
      departmentId: user.departmentId || '',
    })
  }

  const updateUser = (userId) => {
    const body = {
      fullName: editUserForm.fullName.trim(),
      jobTitle: editUserForm.jobTitle.trim(),
      email: editUserForm.email.trim(),
    }
    if (editUserForm.password.trim()) body.password = editUserForm.password
    if (editUserForm.departmentId) body.departmentId = editUserForm.departmentId

    run(async () => {
      await api(`${apiBase}/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setEditingUser(null)
    })
  }

  const deleteUser = (userId) => {
    run(async () => {
      await api(`${apiBase}/users/${userId}`, { method: 'DELETE' })
    })
  }

  const updateOrganization = (e) => {
    e.preventDefault()
    runAndNotify(async () => {
      await api(`/api/organizations/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify(orgForm),
      })
    })
  }

  if (loading) {
    return <LoadingState label="Loading team data…" />
  }

  const orgAdmins = users.filter((u) => u.role === 'ORG_ADMIN')
  const orgUsers = users.filter((u) => u.role === 'USER')
  const sectionWrap = (children, title, description) => (
    <Card>
      {(title || description) && <CardHeader title={title} description={description} />}
      {children}
    </Card>
  )

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {isSuperAdmin && showOrganization && organization && (
        sectionWrap(
          <form onSubmit={updateOrganization} className="grid sm:grid-cols-2 gap-4">
            <Input
              placeholder="Organization name"
              required
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
            />
            <Input
              placeholder="Slug"
              required
              value={orgForm.slug}
              onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
            />
            <Button type="submit" className="sm:col-span-2 w-full sm:w-auto">Save organization</Button>
          </form>,
          'Organization settings',
          'Update the display name and URL slug for this organization.',
        )
      )}

      {isSuperAdmin && showOrganization && (
        sectionWrap(
          <>
            {orgAdmins.length === 0 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run(async () => {
                    await api(`${apiBase}/users`, {
                      method: 'POST',
                      body: JSON.stringify({ ...adminForm, role: 'ORG_ADMIN' }),
                    })
                    setAdminForm(emptyAdminForm())
                  })
                }}
                className="grid sm:grid-cols-2 gap-3 mb-4"
              >
                <ProfileFields form={adminForm} onChange={setAdminForm} />
                <Button type="submit" className="sm:col-span-2 w-full sm:w-auto">Add org admin</Button>
              </form>
            )}
            {orgAdmins.length > 0 && (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {orgAdmins.map((admin) => (
                  <li key={admin.id} className="px-4 py-3.5 bg-white even:bg-slate-50/40">
                    {editingUser === admin.id ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <ProfileFields form={editUserForm} onChange={setEditUserForm} />
                        <div className="sm:col-span-2 flex gap-2">
                          <Button size="sm" onClick={() => updateUser(admin.id)}>Save</Button>
                          <Button variant="secondary" size="sm" onClick={() => setEditingUser(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                        <UserIdentity user={admin} />
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEditUser(admin)}>Edit</Button>
                          <ConfirmButton
                            label="Delete"
                            confirmMessage={`Remove org admin ${admin.email}?`}
                            onConfirm={() => deleteUser(admin.id)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>,
          'Organization admins',
          'Administrators who can manage scorecards, calls, and team members.',
        )
      )}

      {showDepartments &&
        sectionWrap(
          <>
            <form onSubmit={createDepartment} className="flex gap-3 mb-4">
              <Input
                placeholder="Department name"
                required
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="shrink-0">Add department</Button>
            </form>
            {departments.length === 0 ? (
              <p className="text-sm text-slate-500 leading-relaxed">
                No departments yet. Add at least one department, then switch to Users to invite team members.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {departments.map((d) => (
                  <li key={d.id} className="px-4 py-3.5 bg-white even:bg-slate-50/40">
                    {editingDept === d.id ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault()
                          updateDepartment(d.id, new FormData(e.currentTarget).get('name'))
                        }}
                      >
                        <input
                          name="name"
                          defaultValue={d.name}
                          required
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                        <Button type="submit" size="sm">Save</Button>
                        <Button variant="secondary" size="sm" type="button" onClick={() => setEditingDept(null)}>
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center text-sm gap-2">
                        <div>
                          <span className="font-semibold text-slate-900">{d.name}</span>
                          <span className="text-slate-500 ml-2 text-xs">{d._count.users} users</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingDept(d.id)}>Edit</Button>
                          <ConfirmButton
                            label="Delete"
                            confirmMessage={`Delete department "${d.name}"? Users will be unassigned.`}
                            onConfirm={() => deleteDepartment(d.id)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>,
          'Departments',
          'Group users by team or function for reporting and call assignment.',
        )}

      {showUsers &&
        sectionWrap(
          <>
            <form onSubmit={createUser} className="grid sm:grid-cols-2 gap-3 mb-4">
              <ProfileFields form={userForm} onChange={setUserForm} includeDepartment departments={departments} />
              <Button type="submit" disabled={departments.length === 0} className="sm:col-span-2 w-full sm:w-auto">
                Create user
              </Button>
            </form>
            {orgUsers.length === 0 ? (
              <p className="text-sm text-slate-500">No users yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {orgUsers.map((u) => (
                  <li key={u.id} className="px-4 py-3.5 bg-white even:bg-slate-50/40">
                    {editingUser === u.id ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <ProfileFields
                          form={editUserForm}
                          onChange={setEditUserForm}
                          includeDepartment
                          departments={departments}
                        />
                        <div className="sm:col-span-2 flex gap-2">
                          <Button size="sm" onClick={() => updateUser(u.id)}>Save</Button>
                          <Button variant="secondary" size="sm" onClick={() => setEditingUser(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm">
                        <div>
                          <UserIdentity user={u} />
                          <span className="text-slate-500 text-xs mt-1 block pl-[44px]">
                            {u.department?.name || 'No department'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEditUser(u)}>Edit</Button>
                          <ConfirmButton
                            label="Delete"
                            confirmMessage={`Delete user ${u.email}?`}
                            onConfirm={() => deleteUser(u.id)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-1.5"
                          />
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>,
          'Team members',
          'Agents and reviewers who upload calls and view QA results.',
        )}
    </div>
  )
}
