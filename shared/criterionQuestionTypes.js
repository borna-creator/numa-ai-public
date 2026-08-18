export const CRITERION_QUESTION_TYPES = [
  { value: 'YES_NO', label: 'Yes / No' },
  { value: 'EXCELLENT_GOOD_POOR', label: 'Excellent / Good / Poor' },
  { value: 'CONVERSATIONAL', label: 'Conversational' },
]

export const DEFAULT_CRITERION_QUESTION_TYPE = 'YES_NO'

export const CRITERION_QUESTION_TYPE_VALUES = CRITERION_QUESTION_TYPES.map((t) => t.value)

export function isValidCriterionQuestionType(value) {
  return CRITERION_QUESTION_TYPE_VALUES.includes(value)
}

export function getCriterionQuestionTypeLabel(value) {
  return CRITERION_QUESTION_TYPES.find((t) => t.value === value)?.label ?? value
}
