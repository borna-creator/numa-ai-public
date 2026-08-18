const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700',
  PROCESSING: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-700',
}

export function CallStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
