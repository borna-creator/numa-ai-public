import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { getOrgApiBase } from '../../orgApi.js'
import { getUserDisplayName } from '../../../../shared/userProfile.js'

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
    <div>
      <span className="font-medium text-slate-900">{getUserDisplayName(user)}</span>
      {user.jobTitle && (
        <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {user.jobTitle}
        </span>
      )}
      {showEmail && user.fullName && (
        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
      )}
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
    return <p className="text-slate-500 text-sm">Loading…</p>
  }

  const orgAdmins = users.filter((u) => u.role === 'ORG_ADMIN')
  const orgUsers = users.filter((u) => u.role === 'USER')
  const sectionClass = activeSection
    ? 'space-y-4'
    : 'rounded-2xl border border-slate-200/80 bg-white p-6'

  return (
    <div className={activeSection ? 'space-y-6' : 'space-y-8'}>
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      {isSuperAdmin && showOrganization && organization && (
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization settings</h2>
          <form onSubmit={updateOrganization} className="grid sm:grid-cols-2 gap-4">
            <input
              placeholder="Organization name"
              required
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <input
              placeholder="Slug"
              required
              value={orgForm.slug}
              onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <button
              type="submit"
              className="sm:col-span-2 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700"
            >
              Save organization
            </button>
          </form>
        </section>
      )}

      {isSuperAdmin && showOrganization && (
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization admins</h2>
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
              <button
                type="submit"
                className="sm:col-span-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-numa-600 hover:bg-numa-700"
              >
                Add org admin
              </button>
            </form>
          )}
          {orgAdmins.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {orgAdmins.map((admin) => (
                <li key={admin.id} className="px-4 py-3">
                  {editingUser === admin.id ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <ProfileFields
                        form={editUserForm}
                        onChange={setEditUserForm}
                      />
                      <div className="sm:col-span-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateUser(admin.id)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-numa-600"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                      <UserIdentity user={admin} />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditUser(admin)}
                          className="text-numa-600 hover:underline"
                        >
                          Edit
                        </button>
                        <ConfirmButton
                          label="Delete"
                          confirmMessage={`Remove org admin ${admin.email}?`}
                          onConfirm={() => deleteUser(admin.id)}
                          className="text-red-600 hover:underline"
                        />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showDepartments && (
      <section className={sectionClass}>
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
          <p className="text-sm text-slate-500">
            No departments yet. Add at least one department, then switch to the Users tab to add team members.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {departments.map((d) => (
              <li key={d.id} className="px-4 py-3">
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
                    <button type="submit" className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-numa-600">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDept(null)}
                      className="px-3 py-2 rounded-lg text-sm text-slate-600 border border-slate-200"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center text-sm gap-2">
                    <div>
                      <span className="font-medium text-slate-900">{d.name}</span>
                      <span className="text-slate-500 ml-2">{d._count.users} users</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingDept(d.id)}
                        className="text-numa-600 hover:underline"
                      >
                        Edit
                      </button>
                      <ConfirmButton
                        label="Delete"
                        confirmMessage={`Delete department "${d.name}"? Users will be unassigned from it.`}
                        onConfirm={() => deleteDepartment(d.id)}
                        className="text-red-600 hover:underline"
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      {showUsers && (
      <section className={sectionClass}>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Users</h2>
        <form onSubmit={createUser} className="grid sm:grid-cols-2 gap-3 mb-4">
          <ProfileFields
            form={userForm}
            onChange={setUserForm}
            includeDepartment
            departments={departments}
          />
          <button
            type="submit"
            disabled={departments.length === 0}
            className="sm:col-span-2 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700 disabled:opacity-50"
          >
            Create user
          </button>
        </form>
        {orgUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No users yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
            {orgUsers.map((u) => (
              <li key={u.id} className="px-4 py-3">
                {editingUser === u.id ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <ProfileFields
                      form={editUserForm}
                      onChange={setEditUserForm}
                      includeDepartment
                      departments={departments}
                    />
                    <div className="sm:col-span-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateUser(u.id)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-numa-600"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
                    <div>
                      <UserIdentity user={u} />
                      <span className="text-slate-500 text-xs mt-1 block">{u.department?.name || '—'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditUser(u)}
                        className="text-numa-600 hover:underline"
                      >
                        Edit
                      </button>
                      <ConfirmButton
                        label="Delete"
                        confirmMessage={`Delete user ${u.email}?`}
                        onConfirm={() => deleteUser(u.id)}
                        className="text-red-600 hover:underline"
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      )}
    </div>
  )
}
