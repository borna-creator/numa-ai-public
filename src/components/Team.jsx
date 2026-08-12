const team = [
  {
    name: 'Ahmed Mahouachi',
    role: 'Founder, General Manager',
    region: 'UAE',
    email: 'ahmed@numa-iq.com',
    phone: '+971 58 561 9100',
    phoneTel: '+971585619100',
  },
  {
    name: 'Mounir Sahli',
    role: 'Chairman, Investor',
    region: 'UAE',
    email: 'mounir@numa-iq.com',
    phone: '+971 52 558 2104',
    phoneTel: '+971525582104',
  },
  {
    name: 'Jalel Ben Romdhane',
    role: 'Operating Partner',
    region: 'TUN',
    email: 'jalel@numa-iq.com',
    phone: '+216 50 050 033',
    phoneTel: '+21650050033',
  },
  {
    name: 'Mohamed Dhaou',
    role: 'Co-founder, CFO',
    region: 'TUN',
    email: 'cfo@numa-iq.com',
    phone: '+216 26 457 448',
    phoneTel: '+21626457448',
  },
  {
    name: 'Ala Ben Brahim',
    role: 'Sales',
    region: 'TUN',
    email: 'customer@numa-iq.com',
    phone: '+216 52 390 760',
    phoneTel: '+21652390760',
  },
]

function RegionBadge({ region }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
      {region}
    </span>
  )
}

export default function Team() {
  return (
    <section id="team" className="py-20 bg-gradient-to-b from-white to-slate-50/80 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-numa-100/30 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-numa-50 text-sm font-semibold text-numa-700 mb-4">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            The people behind{' '}
            <span className="gradient-text">NumaIQ</span>
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Based in Dubai and Tunisia, our team brings together deep expertise in AI,
            telephony, and enterprise operations across the region.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden mb-6">
          <div className="p-8 sm:p-10 bg-gradient-to-br from-numa-50/50 to-white border-b border-slate-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-numa-600 mb-4">
              Head Office
            </h3>
            <address className="not-italic text-slate-600 leading-relaxed">
              IFZA Business Park<br />
              00000 — Dubai<br />
              United Arab Emirates
            </address>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Region</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((member) => (
                  <tr key={member.email} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">{member.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{member.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RegionBadge region={member.region} />
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-numa-50 text-numa-700">
                          HQ
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <a
                          href={`mailto:${member.email}`}
                          className="text-numa-600 hover:text-numa-700 transition-colors"
                        >
                          {member.email}
                        </a>
                        <a
                          href={`tel:${member.phoneTel}`}
                          className="text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          {member.phone}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile-friendly stacked cards (visible on small screens where table scrolls) */}
        <div className="grid gap-4 md:hidden">
          {team.map((member) => (
            <div
              key={`card-${member.email}`}
              className="p-5 rounded-xl border border-slate-200/80 bg-white"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-900">{member.name}</h3>
                <div className="flex gap-1.5 shrink-0">
                  <RegionBadge region={member.region} />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-numa-50 text-numa-700">
                    HQ
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">{member.role}</p>
              <a href={`mailto:${member.email}`} className="block text-sm text-numa-600 hover:underline">
                {member.email}
              </a>
              <a href={`tel:${member.phoneTel}`} className="block text-sm text-slate-500 mt-1 hover:underline">
                {member.phone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
