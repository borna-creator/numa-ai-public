import WaveBackground from './WaveBackground'

function VoiceVisualizer() {
  const bars = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 0.85, 0.55, 0.75, 0.45, 0.95]

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-numa-400/20 to-cyan-400/20 animate-pulse-ring" />
      <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-numa-500/10 to-cyan-500/10 animate-pulse-ring" style={{ animationDelay: '1s' }} />

      <div className="relative glass rounded-3xl p-8 shadow-2xl shadow-numa-500/10 animate-float">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-slate-500">Live Call — English</span>
        </div>

        <div className="flex items-end justify-center gap-1.5 h-24 mb-6">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-2 rounded-full bg-gradient-to-t from-numa-600 to-cyan-400"
              style={{
                height: `${h * 100}%`,
                animation: `float ${1.5 + (i % 3) * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-numa-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-numa-600">AI</span>
            </div>
            <div className="bg-numa-50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-700 max-w-[220px]">
              I can confirm your account details. One moment while I check our system...
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <div className="bg-slate-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-slate-700 max-w-[220px]">
              Yes, please verify my order status.
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-500">C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden bg-gradient-to-b from-white via-numa-50/30 to-white">
      <WaveBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-numa-50 border border-numa-200/60 text-sm font-medium text-numa-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Next-generation AI voice technology
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Voice agents that sound{' '}
            <span className="gradient-text">indistinguishable</span> from humans
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
            NumaIQ deploys AI voice agents capable of making real phone calls in English,
            Arabic, and French — connecting to your databases, confirming information,
            and handling everything a human agent can do. Faster. Smarter. At scale.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-numa-600 to-cyan-500 rounded-xl hover:shadow-xl hover:shadow-numa-500/25 transition-all hover:-translate-y-0.5"
            >
              Request a Demo
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#voice-agents"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-numa-700 bg-white border border-numa-200 rounded-xl hover:bg-numa-50 transition-colors"
            >
              Explore Products
            </a>
          </div>

          <div className="flex items-center gap-8 mt-10 pt-8 border-t border-slate-200/60">
            <div>
              <div className="text-2xl font-bold text-slate-900">&lt;200ms</div>
              <div className="text-sm text-slate-500">Response latency</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <div className="text-2xl font-bold text-slate-900">5</div>
              <div className="text-sm text-slate-500">Languages</div>
            </div>
            <div className="w-px h-10 bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-2xl font-bold text-slate-900">24/7</div>
              <div className="text-sm text-slate-500">Always available</div>
            </div>
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <VoiceVisualizer />
        </div>
      </div>
    </section>
  )
}
