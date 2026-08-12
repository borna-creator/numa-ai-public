import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogoWide } from './Logo'

const navLinks = [
  { label: 'Voice Agents', href: '/#voice-agents' },
  { label: 'QA Platform', href: '/#qa-platform' },
  { label: 'Languages', href: '/#languages' },
  { label: 'Features', href: '/#features' },
  { label: 'Team', href: '/#team' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="glass mx-4 mt-4 md:mx-auto md:max-w-6xl rounded-2xl px-5 py-3.5 shadow-sm shadow-numa-500/5">
        <div className="flex items-center justify-between">
          <Link to="/" className="shrink-0">
            <LogoWide className="h-8 sm:h-9 w-auto" />
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-numa-600 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/#contact"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-numa-600 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-numa-500/30 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </a>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-200/60">
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block py-2 text-sm font-medium text-slate-600 hover:text-numa-600"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/#contact"
                  className="block mt-2 text-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-numa-600 to-cyan-500 rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  )
}
