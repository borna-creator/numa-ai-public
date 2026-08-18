export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className={`ml-1.5 tabular-nums ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                ({tab.count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
