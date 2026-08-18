const STATUS_STYLES = {
  PENDING: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 ring-amber-600/15' },
  PROCESSING: { dot: 'bg-blue-500 animate-pulse', pill: 'bg-blue-50 text-blue-800 ring-blue-600/15' },
  COMPLETED: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15' },
  FAILED: { dot: 'bg-red-500', pill: 'bg-red-50 text-red-800 ring-red-600/15' },
}

export function CallStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600 ring-slate-500/10' }
  const label = status.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${style.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  )
}
