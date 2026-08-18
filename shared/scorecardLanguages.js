export const SCORECARD_LANGUAGES = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'ARABIC', label: 'Arabic' },
  { value: 'FRENCH', label: 'French' },
]

export const DEFAULT_SCORECARD_LANGUAGE = 'ENGLISH'

export const SCORECARD_LANGUAGE_VALUES = SCORECARD_LANGUAGES.map((l) => l.value)

export function isValidScorecardLanguage(value) {
  return SCORECARD_LANGUAGE_VALUES.includes(value)
}

export function getScorecardLanguageLabel(value) {
  return SCORECARD_LANGUAGES.find((l) => l.value === value)?.label ?? value
}
