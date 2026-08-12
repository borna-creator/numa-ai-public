function ScorecardPreview() {
  const questions = [
    { q: 'Did the agent mention the call is being recorded?', answer: 'YES', type: 'binary', pass: true },
    { q: 'How was the greeting quality?', answer: 'EXCELLENT', type: 'graded', pass: true },
    { q: 'Was customer identity verified?', answer: 'YES', type: 'binary', pass: true },
    { q: 'How was the closing statement?', answer: 'GOOD', type: 'graded', pass: true },
    { q: 'Were all required disclosures read?', answer: 'NO', type: 'binary', pass: false },
  ]

  return (
    <div className="glass rounded-2xl p-6 shadow-xl shadow-numa-500/5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h4 className="font-bold text-slate-900">Compliance Scorecard</h4>
          <p className="text-xs text-slate-500 mt-0.5">Call #2847 — Auto-scored</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-numa-600">87%</div>
          <div className="text-xs text-slate-500">Overall Score</div>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((item) => (
          <div
            key={item.q}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/80 border border-slate-100"
          >
            <span className="text-sm text-slate-700 flex-1">{item.q}</span>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${
                item.pass
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {item.answer}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 p-4 rounded-xl bg-numa-50/80 border border-numa-100">
        <div className="text-xs font-semibold text-numa-700 mb-1">AI Insight</div>
        <p className="text-sm text-slate-600">
          Agent missed required disclosure at 02:34. Recommend adding disclosure prompt to call flow.
        </p>
      </div>
    </div>
  )
}

function TranscriptPreview() {
  const lines = [
    { role: 'agent', time: '00:01', text: 'Thank you for calling. This call may be recorded for quality purposes.' },
    { role: 'caller', time: '00:08', text: 'Hi, I need to check on my recent order please.' },
    { role: 'agent', time: '00:12', text: 'Of course. Let me pull up your account. Can I have your order number?' },
    { role: 'caller', time: '00:18', text: 'Yes, it\'s ORD-92847.' },
  ]

  return (
    <div className="glass rounded-2xl p-6 shadow-xl shadow-numa-500/5">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-numa-500" />
          <span className="text-xs font-semibold text-numa-600">Agent</span>
        </div>
        <div className="flex items-center gap-1.5 ml-3">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Caller</span>
        </div>
        <span className="ml-auto text-xs text-slate-400">Auto-detected roles</span>
      </div>

      <div className="space-y-3 max-h-64 overflow-hidden">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-xs text-slate-400 font-mono shrink-0 pt-0.5">{line.time}</span>
            <div className="flex-1">
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  line.role === 'agent' ? 'text-numa-600' : 'text-slate-500'
                }`}
              >
                {line.role}
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{line.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const qaFeatures = [
  {
    title: 'Upload or Auto-Ingest',
    description: 'Upload your own call recordings or automatically use calls made by NumaIQ agents — all processed in seconds.',
  },
  {
    title: 'Automatic Role Detection',
    description: 'AI automatically identifies who is the customer rep and who is the caller, with timestamped role-based transcriptions.',
  },
  {
    title: 'Custom Scorecards',
    description: 'Build compliance scorecards with binary (YES/NO) and graded (POOR/GOOD/EXCELLENT) questions tailored to your requirements.',
  },
  {
    title: 'Instant Scoring & Insights',
    description: 'Get automated scores and actionable insights on every call. Spot compliance gaps before they become problems.',
  },
]

export default function QAPlatform() {
  return (
    <section id="qa-platform" className="py-24 bg-gradient-to-b from-numa-50/50 to-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-numa-100/30 to-cyan-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white text-sm font-semibold text-numa-700 mb-4 shadow-sm">
            QA Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Compliance scoring at{' '}
            <span className="gradient-text">machine speed</span>
          </h2>
          <p className="text-lg text-slate-600">
            A powerful QA platform connected directly to your voice agents. Score calls,
            detect compliance issues, and get insights — all automated, all fast.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <TranscriptPreview />
          <ScorecardPreview />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {qaFeatures.map((feature) => (
            <div
              key={feature.title}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
