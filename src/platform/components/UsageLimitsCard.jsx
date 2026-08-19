import { Alert } from './ui.jsx'

function formatPeriodEnd(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ordinalDay(day) {
  if (day >= 11 && day <= 13) return `${day}th`
  const last = day % 10
  if (last === 1) return `${day}st`
  if (last === 2) return `${day}nd`
  if (last === 3) return `${day}rd`
  return `${day}th`
}

export default function UsageLimitsCard({ usage, limits, title = 'Usage limits' }) {
  if (!usage) return null

  const totalCap = limits?.usageMinutesCap ?? usage.totalMinutesCap
  const monthlyCap = limits?.usageMinutesMonthlyCap ?? usage.monthlyMinutesCap
  const resetDay = limits?.usageResetDayOfMonth ?? usage.usageResetDayOfMonth
  const hasLimits = totalCap != null || monthlyCap != null

  return (
    <Alert variant={usage.atCap ? 'warning' : 'info'}>
      <p className="font-semibold text-slate-900">{title}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p>
          <span className="font-medium">Total:</span>{' '}
          {usage.totalMinutesUsed ?? usage.minutesUsed ?? 0} minutes used
          {totalCap != null ? (
            <>
              {' '}
              of {totalCap} cap
              {usage.totalMinutesRemaining != null &&
                ` (${usage.totalMinutesRemaining} remaining)`}
            </>
          ) : (
            ' · No total cap'
          )}
        </p>
        {monthlyCap != null && (
          <p>
            <span className="font-medium">This period:</span>{' '}
            {usage.monthlyMinutesUsed ?? 0} of {monthlyCap} minutes
            {usage.monthlyMinutesRemaining != null &&
              ` (${usage.monthlyMinutesRemaining} remaining)`}
            {usage.monthlyPeriodEnd && ` · Resets ${formatPeriodEnd(usage.monthlyPeriodEnd)}`}
            {resetDay != null && ` (${ordinalDay(resetDay)} each month)`}
          </p>
        )}
        {!hasLimits && (
          <p className="text-slate-600">No usage limits are configured for your organization.</p>
        )}
      </div>
    </Alert>
  )
}
