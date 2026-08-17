import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Session from 'supertokens-auth-react/recipe/session'
import { useAuth } from '../context/AuthContext.jsx'

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    Session.doesSessionExist().then((exists) => {
      setHasSession(exists)
      setSessionChecked(true)
    })
  }, [])

  if (!sessionChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    )
  }

  if (!hasSession) {
    return <Navigate to="/platform/login" replace />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900 mb-2">Account not provisioned</h1>
          <p className="text-slate-600 text-sm">
            Your login exists but no platform profile was found. Contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/platform" replace />
  }

  return <Outlet context={{ user }} />
}
