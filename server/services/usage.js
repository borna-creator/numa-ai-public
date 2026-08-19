import { prisma } from '../db.js'

export function secondsToUsageMinutes(durationSec) {
  if (durationSec == null || durationSec <= 0) return 0
  return Math.ceil(durationSec / 60)
}

/** UTC billing period: [periodStart, periodEnd) anchored on resetDayOfMonth (1–28). */
export function getUsagePeriodBounds(resetDayOfMonth, now = new Date()) {
  if (resetDayOfMonth == null) return null

  const day = Number(resetDayOfMonth)
  if (!Number.isInteger(day) || day < 1 || day > 28) return null

  const startOfDayUtc = (year, month, dom) => new Date(Date.UTC(year, month, dom, 0, 0, 0, 0))

  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const date = now.getUTCDate()

  const periodStart =
    date >= day ? startOfDayUtc(y, m, day) : startOfDayUtc(y, m - 1, day)

  const periodEnd = startOfDayUtc(
    periodStart.getUTCFullYear(),
    periodStart.getUTCMonth() + 1,
    day,
  )

  return { periodStart, periodEnd }
}

export async function getOrgUsageMinutes(orgId) {
  return getOrgTotalUsageMinutes(orgId)
}

export async function getOrgTotalUsageMinutes(orgId) {
  const agg = await prisma.call.aggregate({
    where: { organizationId: orgId, durationSec: { not: null } },
    _sum: { durationSec: true },
  })
  return secondsToUsageMinutes(agg._sum.durationSec ?? 0)
}

export async function getOrgMonthlyUsageMinutes(orgId, periodStart, periodEnd) {
  const agg = await prisma.call.aggregate({
    where: {
      organizationId: orgId,
      durationSec: { not: null },
      processingJob: {
        completedAt: {
          gte: periodStart,
          lt: periodEnd,
        },
      },
    },
    _sum: { durationSec: true },
  })
  return secondsToUsageMinutes(agg._sum.durationSec ?? 0)
}

export async function getOrgUsageSummary(orgId) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      usageMinutesCap: true,
      usageMinutesMonthlyCap: true,
      usageResetDayOfMonth: true,
    },
  })
  if (!org) return null

  const totalMinutesUsed = await getOrgTotalUsageMinutes(orgId)
  const totalMinutesCap = org.usageMinutesCap
  const atTotalCap = totalMinutesCap != null && totalMinutesUsed >= totalMinutesCap

  let monthlyMinutesUsed = null
  const monthlyMinutesCap = org.usageMinutesMonthlyCap
  let monthlyMinutesRemaining = null
  let atMonthlyCap = false
  let monthlyPeriodStart = null
  let monthlyPeriodEnd = null

  if (monthlyMinutesCap != null && org.usageResetDayOfMonth != null) {
    const bounds = getUsagePeriodBounds(org.usageResetDayOfMonth)
    if (bounds) {
      monthlyPeriodStart = bounds.periodStart.toISOString()
      monthlyPeriodEnd = bounds.periodEnd.toISOString()
      monthlyMinutesUsed = await getOrgMonthlyUsageMinutes(
        orgId,
        bounds.periodStart,
        bounds.periodEnd,
      )
      monthlyMinutesRemaining = Math.max(0, monthlyMinutesCap - monthlyMinutesUsed)
      atMonthlyCap = monthlyMinutesUsed >= monthlyMinutesCap
    }
  }

  const atCap = atTotalCap || atMonthlyCap

  return {
    totalMinutesUsed,
    totalMinutesCap,
    totalMinutesRemaining:
      totalMinutesCap != null ? Math.max(0, totalMinutesCap - totalMinutesUsed) : null,
    atTotalCap,

    monthlyMinutesUsed,
    monthlyMinutesCap,
    monthlyMinutesRemaining,
    atMonthlyCap,
    monthlyPeriodStart,
    monthlyPeriodEnd,
    usageResetDayOfMonth: org.usageResetDayOfMonth,

    minutesUsed: totalMinutesUsed,
    minutesCap: totalMinutesCap,
    minutesRemaining:
      totalMinutesCap != null ? Math.max(0, totalMinutesCap - totalMinutesUsed) : null,
    atCap,
  }
}

export async function assertOrgWithinUsageCap(orgId) {
  const summary = await getOrgUsageSummary(orgId)
  if (!summary?.atCap) return summary

  let message
  if (summary.atTotalCap && summary.atMonthlyCap) {
    message =
      'Organization usage limits reached (total and monthly allowances). Contact your administrator.'
  } else if (summary.atMonthlyCap) {
    message = `Monthly usage limit reached (${summary.monthlyMinutesCap} minutes). Resets on day ${summary.usageResetDayOfMonth} of each month.`
  } else {
    message = `Total usage limit reached (${summary.totalMinutesCap} minutes). Contact your administrator.`
  }

  const err = new Error(message)
  err.status = 403
  throw err
}
