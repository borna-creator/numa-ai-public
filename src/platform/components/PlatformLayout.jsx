import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LogoWide } from '../../components/Logo.jsx'
import { getUserDisplayName } from '../../../shared/userProfile.js'
import { Avatar, Button } from './ui.jsx'

function roleLabel(role) {
  return role?.replace(/_/g, ' ') ?? 'User'
}

export default function PlatformLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/platform/login')
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-numa-400/10 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[420px] h-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <Link to="/platform" className="shrink-0">
            <LogoWide className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Avatar name={getUserDisplayName(user)} size="sm" />
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{getUserDisplayName(user)}</p>
                <p className="text-xs text-slate-500">{user?.jobTitle || user?.email}</p>
              </div>
            </div>
            <span className="hidden md:inline text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-numa-50 text-numa-700 border border-numa-100">
              {roleLabel(user?.role)}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-3xl leading-relaxed">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
