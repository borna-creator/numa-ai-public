export default function CTA() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-numa-600 via-numa-700 to-cyan-600" />
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute bottom-0 left-0 w-[200%] animate-wave-drift" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: '60%' }}>
          <path fill="white" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
          Ready to transform your voice operations?
        </h2>
        <p className="text-lg text-numa-100 mb-10 max-w-2xl mx-auto">
          See NumaIQ in action. Deploy AI voice agents that sound human, score every call
          for compliance, and scale without limits.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://calendly.com/hello-numa-iq/"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-numa-700 bg-white rounded-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
          >
            Schedule a Demo
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </a>
          <a
            href="https://calendly.com/hello-numa-iq/"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  )
}
