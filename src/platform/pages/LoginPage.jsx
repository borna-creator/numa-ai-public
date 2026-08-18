import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signIn } from 'supertokens-auth-react/recipe/emailpassword'
import { useAuth } from '../context/AuthContext.jsx'
import { LogoWide } from '../../components/Logo.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refresh, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/platform" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await signIn({
        formFields: [
          { id: 'email', value: email.trim() },
          { id: 'password', value: password },
        ],
      })

      if (response.status === 'WRONG_CREDENTIALS_ERROR') {
        setError('Invalid email or password')
        return
      }

      if (response.status !== 'OK') {
        setError('Unable to sign in. Please try again.')
        return
      }

      await refresh()
      navigate('/platform')
    } catch {
      setError('Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 w-[480px] h-[480px] rounded-full bg-numa-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/">
            <LogoWide className="h-10 w-auto mx-auto" />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-slate-500">Sign in to the NumaIQ QA platform</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-8 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30 focus:border-numa-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30 focus:border-numa-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-numa-600 to-cyan-500 hover:shadow-lg hover:shadow-numa-500/25 transition-all disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6 relative">
          <Link to="/" className="text-numa-600 hover:underline font-medium">← Back to website</Link>
        </p>
      </div>
    </div>
  )
}
