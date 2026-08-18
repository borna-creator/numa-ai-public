/**
 * Compute overall score (0–100) from weighted criterion results.
 */
export function computeOverallScore(results, criteria) {
  if (!results?.length || !criteria?.length) {
    return null
  }

  const weightById = new Map(criteria.map((c) => [c.id, c.weight]))
  let totalWeight = 0
  let weightedSum = 0

  for (const result of results) {
    const weight = weightById.get(result.criterionId) ?? 1
    if (result.passed === null || result.passed === undefined) {
      continue
    }
    totalWeight += weight
    weightedSum += (result.passed ? 100 : 0) * weight
  }

  if (totalWeight === 0) {
    return null
  }

  return Math.round(weightedSum / totalWeight)
}

export function normalizeCallbackResults(rawResults, criteria) {
  const criterionIds = new Set(criteria.map((c) => c.id))

  return rawResults
    .filter((r) => criterionIds.has(r.criterionId))
    .map((r) => ({
      criterionId: r.criterionId,
      value: String(r.value ?? '').trim(),
      passed: r.passed ?? null,
      reasoning: r.reasoning?.trim() || null,
    }))
}
