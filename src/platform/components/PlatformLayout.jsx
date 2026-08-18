import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LogoWide } from '../../components/Logo.jsx'
import { getUserDisplayName } from '../../../shared/userProfile.js'

export default function PlatformLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/platform/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/platform">
            <LogoWide className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-700">{getUserDisplayName(user)}</p>
              {user?.jobTitle && (
                <p className="text-xs text-slate-500">{user.jobTitle}</p>
              )}
              {!user?.fullName && user?.email && (
                <p className="text-xs text-slate-500">{user.email}</p>
              )}
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-numa-50 text-numa-700">
              {user?.role?.replace('_', ' ')}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-numa-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {title && (
          <h1 className="text-2xl font-bold text-slate-900 mb-6">{title}</h1>
        )}
        {children}
      </main>
    </div>
  )
}
