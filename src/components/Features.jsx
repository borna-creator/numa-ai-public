const pillars = [
  {
    id: 'speed',
    label: 'Speed',
    stat: '<200ms',
    statLabel: 'avg. response',
    title: 'Conversations that never miss a beat',
    description:
      'Sub-200ms latency with natural turn-taking. No robotic pauses — callers experience fluid, human-paced dialogue from hello to goodbye.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: 'from-numa-500 to-cyan-400',
    bg: 'from-numa-50 to-cyan-50/50',
  },
  {
    id: 'scale',
    label: 'Scale',
    stat: '∞',
    statLabel: 'concurrent calls',
    title: 'One agent or ten thousand',
    description:
      'Spin up a single line or flood your operation with thousands of simultaneous calls. Performance stays consistent — no queues, no degradation.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    accent: 'from-violet-500 to-numa-500',
    bg: 'from-violet-50/80 to-numa-50/50',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    stat: '100%',
    statLabel: 'call coverage',
    title: 'Every call scored, nothing overlooked',
    description:
      'Automatic transcriptions, role detection, and scorecard grading on every interaction. Catch compliance gaps before they become liabilities.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    accent: 'from-emerald-500 to-cyan-500',
    bg: 'from-emerald-50/80 to-cyan-50/50',
  },
]

const workflow = [
  {
    step: 1,
    title: 'Connect',
    description: 'Plug into your phone system, CRM, and databases.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Configure',
    description: 'Set call flows, scripts, and compliance scorecards.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Deploy',
    description: 'Launch agents that handle calls in any language.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Analyze',
    description: 'Review scores, transcripts, and insights live.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

function LatencyBars() {
  const bars = [0.3, 0.5, 0.85, 0.6, 1, 0.7, 0.45, 0.9, 0.55, 0.75, 0.4, 0.65]
  return (
    <div className="flex items-end gap-1.5 h-14">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-2 rounded-full bg-gradient-to-t from-numa-600 to-cyan-400 opacity-80"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  )
}

function ScaleGrid() {
  return (
    <div className="grid grid-cols-5 gap-2 w-full max-w-[200px]">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-md bg-gradient-to-br from-violet-200/70 to-numa-200/70"
          style={{ opacity: 0.45 + (i % 3) * 0.18 }}
        />
      ))}
    </div>
  )
}

function ComplianceRing() {
  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="213.6"
          strokeDashoffset="0"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-emerald-600">100%</span>
      </div>
    </div>
  )
}

const pillarVisuals = {
  speed: LatencyBars,
  scale: ScaleGrid,
  compliance: ComplianceRing,
}

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white via-slate-50/80 to-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-numa-100/40 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-numa-50 text-sm font-semibold text-numa-700 mb-4">
              Why NumaIQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Speed, scale, and compliance —{' '}
              <span className="gradient-text">without compromise</span>
            </h2>
          </div>
          <p className="text-slate-600 max-w-md lg:text-right leading-relaxed">
            End-to-end voice AI that performs like your best team from the first call
            to the final compliance score.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-16 items-start">
          {pillars.map((pillar) => {
            const Visual = pillarVisuals[pillar.id]
            return (
              <div
                key={pillar.id}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${pillar.bg} border border-white shadow-sm hover:shadow-lg hover:shadow-numa-500/5 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pillar.accent} text-white flex items-center justify-center shadow-md`}>
                    {pillar.icon}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-extrabold bg-gradient-to-r ${pillar.accent} bg-clip-text text-transparent`}>
                      {pillar.stat}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">{pillar.statLabel}</div>
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {pillar.label}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{pillar.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>

                <div className="mt-4 pt-4 border-t border-white/60">
                  <Visual />
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Go live in four steps</h3>
          <p className="text-sm text-slate-500 mb-8">From integration to insights — a streamlined path to production.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {workflow.map((item, i) => (
              <div key={item.step} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
                {i < workflow.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-numa-300 to-numa-100"
                    aria-hidden="true"
                  />
                )}

                <div className="relative shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-numa-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-numa-500/20">
                  {item.icon}
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-numa-100 text-[10px] font-bold text-numa-600 flex items-center justify-center">
                    {item.step}
                  </span>
                </div>

                <div className="lg:mt-3">
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
