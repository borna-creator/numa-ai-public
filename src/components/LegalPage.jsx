import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import PageHead from './PageHead'
import { SITE } from '../config/site'

export default function LegalPage({ title, description, path, children }) {
  return (
    <>
      <PageHead
        title={`${title} — ${SITE.name}`}
        description={description}
        path={path}
      />
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="max-w-3xl mx-auto px-6">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-numa-600 hover:text-numa-700 mb-8 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-sm text-slate-500 mb-10">
              Last updated: August 12, 2026
            </p>

            <div className="prose-legal space-y-8 text-slate-600 leading-relaxed">
              {children}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
