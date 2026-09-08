export const VOICE_AGENT_LANGUAGES = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'FRENCH', label: 'French' },
  { value: 'ARABIC', label: 'Arabic' },
]

export const DEFAULT_VOICE_AGENT_LANGUAGE = 'ENGLISH'

export const VOICE_AGENT_LANGUAGE_VALUES = VOICE_AGENT_LANGUAGES.map((l) => l.value)

export function isValidVoiceAgentLanguage(value) {
  return VOICE_AGENT_LANGUAGE_VALUES.includes(value)
}

export function getVoiceAgentLanguageLabel(value) {
  return VOICE_AGENT_LANGUAGES.find((l) => l.value === value)?.label ?? value
}
