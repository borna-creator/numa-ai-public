import { prisma } from '../db.js'

export function secondsToUsageMinutes(durationSec) {
  if (durationSec == null || durationSec <= 0) return 0
  return Math.ceil(durationSec / 60)
}

export async function getOrgUsageMinutes(orgId) {
  const agg = await prisma.call.aggregate({
    where: { organizationId: orgId, durationSec: { not: null } },
    _sum: { durationSec: true },
  })
  return secondsToUsageMinutes(agg._sum.durationSec ?? 0)
}

export async function getOrgUsageSummary(orgId) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { usageMinutesCap: true },
  })
  if (!org) return null

  const minutesUsed = await getOrgUsageMinutes(orgId)
  const minutesCap = org.usageMinutesCap

  return {
    minutesUsed,
    minutesCap,
    minutesRemaining: minutesCap != null ? Math.max(0, minutesCap - minutesUsed) : null,
    atCap: minutesCap != null && minutesUsed >= minutesCap,
  }
}

export async function assertOrgWithinUsageCap(orgId) {
  const summary = await getOrgUsageSummary(orgId)
  if (!summary?.atCap) return summary

  const err = new Error(
    `Organization usage limit reached (${summary.minutesCap} minutes). Contact your administrator.`,
  )
  err.status = 403
  throw err
}
