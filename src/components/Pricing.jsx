import { PRICING_COMPARISON, PRICING_FOOTNOTES, PRICING_LAST_UPDATED, PRICING_PLANS } from '../config/pricing'

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DashIcon() {
  return <span className="text-slate-300 font-medium" aria-label="Not included">—</span>
}

function CellValue({ value }) {
  if (value === true) return <CheckIcon />
  if (value === false) return <DashIcon />
  return <span className="text-sm text-slate-700 leading-snug">{value}</span>
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50/80 via-white to-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-numa-100/50 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-100/40 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-numa-50 text-sm font-semibold text-numa-700 mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Plans that scale with{' '}
            <span className="gradient-text">your voice operations</span>
          </h2>
          <p className="text-lg text-slate-600">
            From a single line to enterprise-wide deployment — transparent minutes,
            overage rates, and features at every tier.
          </p>
        </div>

        <div className="mb-12 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 px-5 py-4 sm:px-6 sm:flex sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-900">Founders offer — first 10 clients</p>
            <p className="text-sm text-amber-800/90 mt-0.5">
              <strong>−30% for life</strong> on Answer and Convert plans. Scale and Custom on discussion.
            </p>
          </div>
          <a
            href="/#contact"
            className="inline-flex shrink-0 items-center justify-center mt-3 sm:mt-0 px-5 py-2.5 text-sm font-semibold text-amber-900 bg-white border border-amber-200 rounded-xl hover:shadow-md transition-all"
          >
            Claim your spot
          </a>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-16">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                plan.highlighted
                  ? 'border-numa-300 bg-white shadow-xl shadow-numa-500/10 ring-2 ring-numa-500/20 scale-[1.02] z-10'
                  : 'border-slate-200/80 bg-white shadow-sm hover:shadow-lg hover:shadow-numa-500/5 hover:-translate-y-0.5'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white bg-gradient-to-r from-numa-600 to-cyan-500 rounded-full shadow-md">
                  Most popular
                </span>
              )}

              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.audience}</p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                  {plan.priceSuffix && (
                    <span className="text-slate-500 font-medium">{plan.priceSuffix}</span>
                  )}
                </div>
                {plan.priceNote && (
                  <p className="text-xs text-slate-500 mt-1">{plan.priceNote}</p>
                )}
                <p className="text-sm text-numa-600 font-medium mt-2">
                  {plan.annualDiscount} prepaid annual
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1 text-sm text-slate-600">
                {PRICING_COMPARISON.slice(0, 6).map((row) => (
                  <li key={row.label} className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                    <span className="text-slate-500">{row.label.replace('*', '')}</span>
                    <span className="font-medium text-slate-800 text-right shrink-0">
                      {row.values[plan.id] === true ? (
                        <span className="text-emerald-600">✓</span>
                      ) : row.values[plan.id] === false ? (
                        '—'
                      ) : (
                        row.values[plan.id]
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref}
                className={`inline-flex items-center justify-center w-full py-3 text-sm font-semibold rounded-xl transition-all ${
                  plan.highlighted
                    ? 'text-white bg-gradient-to-r from-numa-600 to-cyan-500 hover:shadow-lg hover:shadow-numa-500/30 hover:-translate-y-0.5'
                    : 'text-numa-700 bg-numa-50 border border-numa-100 hover:bg-numa-100'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
            <h3 className="text-lg font-bold text-slate-900">Full feature comparison</h3>
            <p className="text-sm text-slate-500 mt-1">All plans include English, Arabic, and French voice agents.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-900 text-white">
                  <th scope="col" className="py-4 pl-6 pr-4 text-sm font-semibold w-[28%] sticky left-0 bg-slate-900 z-10">
                    Feature
                  </th>
                  {PRICING_PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className={`py-4 px-4 text-sm font-semibold text-center min-w-[140px] ${
                        plan.highlighted ? 'bg-numa-700' : ''
                      }`}
                    >
                      <div>{plan.name}</div>
                      <div className="text-xs font-normal text-slate-300 mt-0.5">{plan.audience}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-numa-50/40">
                  <th scope="row" className="py-3.5 pl-6 pr-4 text-sm font-semibold text-slate-900 sticky left-0 bg-numa-50/40 z-10">
                    Monthly price
                  </th>
                  {PRICING_PLANS.map((plan) => (
                    <td
                      key={plan.id}
                      className={`py-3.5 px-4 text-center text-sm font-bold text-slate-900 ${
                        plan.highlighted ? 'bg-numa-50/60' : ''
                      }`}
                    >
                      {plan.price}{plan.priceSuffix}
                    </td>
                  ))}
                </tr>
                {PRICING_COMPARISON.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <th
                      scope="row"
                      className={`py-3.5 pl-6 pr-4 text-sm font-medium text-slate-600 sticky left-0 z-10 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                    >
                      {row.label}
                    </th>
                    {PRICING_PLANS.map((plan) => (
                      <td
                        key={plan.id}
                        className={`py-3.5 px-4 text-center align-middle ${
                          plan.highlighted ? (i % 2 === 0 ? 'bg-numa-50/30' : 'bg-numa-50/50') : ''
                        }`}
                      >
                        <CellValue value={row.values[plan.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            {PRICING_FOOTNOTES.map((note) => (
              <p key={note} className="text-xs text-slate-500">{note}</p>
            ))}
            <p className="text-xs text-slate-400 mt-2">Last updated: {PRICING_LAST_UPDATED}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
