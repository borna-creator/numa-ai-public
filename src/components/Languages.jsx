const languages = [
  {
    code: 'EN',
    name: 'English',
    native: 'English',
    flag: '🇬🇧',
    sample: '"I\'d be happy to help you with that. Let me look into your account right away."',
    direction: 'ltr',
    available: true,
  },
  {
    code: 'AR',
    name: 'Arabic',
    native: 'العربية',
    flag: '🇦🇪',
    sample: '"يسعدني مساعدتك في ذلك. دعني أتحقق من حسابك فوراً."',
    direction: 'rtl',
    available: true,
  },
  {
    code: 'FR',
    name: 'French',
    native: 'Français',
    flag: '🇫🇷',
    sample: '"Je serais ravi de vous aider. Laissez-moi vérifier votre compte tout de suite."',
    direction: 'ltr',
    available: true,
  },
  {
    code: 'TR',
    name: 'Turkish',
    native: 'Türkçe',
    flag: '🇹🇷',
    sample: '"Size yardımcı olmaktan memnuniyet duyarım. Hesabınızı hemen kontrol edeyim."',
    direction: 'ltr',
    available: false,
  },
  {
    code: 'ES',
    name: 'Spanish',
    native: 'Español',
    flag: '🇪🇸',
    sample: '"Estaré encantado de ayudarle. Permítame revisar su cuenta ahora mismo."',
    direction: 'ltr',
    available: false,
  },
]

export default function Languages() {
  return (
    <section id="languages" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-numa-50 text-sm font-semibold text-numa-700 mb-4">
            Multilingual
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Speak your customers&apos;{' '}
            <span className="gradient-text">language</span>
          </h2>
          <p className="text-lg text-slate-600">
            Native-quality voice agents in English, Arabic, and French — with Turkish
            and Spanish currently in development.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`group relative p-8 rounded-2xl border bg-white transition-all duration-300 overflow-hidden ${
                lang.available
                  ? 'border-slate-200/80 hover:border-numa-200 hover:shadow-xl hover:shadow-numa-500/5'
                  : 'border-dashed border-slate-200 opacity-75'
              }`}
            >
              {!lang.available && (
                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Work in progress
                </span>
              )}

              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-numa-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{lang.flag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{lang.name}</h3>
                    <p className="text-sm text-slate-500">{lang.native}</p>
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-4"
                  dir={lang.direction}
                >
                  <p className="text-sm text-slate-600 italic leading-relaxed">{lang.sample}</p>
                </div>

                <div className="flex items-center gap-2">
                  {lang.available ? (
                    <>
                      <div className="flex items-end gap-0.5 h-4">
                        {[0.5, 0.8, 1, 0.6, 0.9, 0.4, 0.7].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full bg-gradient-to-t from-numa-500 to-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ height: `${h * 100}%` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">Natural voice quality</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Coming soon</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
