/** Deepgram Nova-3 STT options stored per scorecard (JSON on Scorecard.sttSettings). */

export const STT_SETTING_KEYS = [
  'summarize',
  'detectEntities',
  'sentiment',
  'smartFormat',
  'diarize',
  'punctuate',
  'paragraphs',
  'utterances',
  'profanityFilter',
  'fillerWords',
  'numerals',
  'redactPci',
  'redactPii',
  'redactPhi',
  'redactNumbers',
]

export const STT_SETTINGS_META = [
  { key: 'summarize', label: 'Summarization', description: 'AI summary of the conversation (v2).' },
  { key: 'detectEntities', label: 'Entity detection', description: 'Extract key entities from the transcript.' },
  { key: 'sentiment', label: 'Sentiment', description: 'Word, sentence, and segment-level sentiment.' },
  { key: 'smartFormat', label: 'Smart format', description: 'Improved punctuation, dates, times, and numbers.' },
  { key: 'diarize', label: 'Diarization', description: 'Recognize speaker changes.' },
  { key: 'punctuate', label: 'Punctuation', description: 'Add punctuation and capitalization.' },
  { key: 'paragraphs', label: 'Paragraphs', description: 'Split speech into readable paragraphs.' },
  { key: 'utterances', label: 'Utterances', description: 'Segment speech into semantic units.' },
  { key: 'profanityFilter', label: 'Profanity filter', description: 'Remove profanity from the transcript.' },
  { key: 'fillerWords', label: 'Filler words', description: 'Include disfluencies like "uh" and "um".' },
  { key: 'numerals', label: 'Numerals', description: 'Convert spoken numbers to digits.' },
  { key: 'redactPci', label: 'Redact PCI', description: 'Credit card numbers, expiration, CVV.' },
  { key: 'redactPii', label: 'Redact PII', description: 'Names, locations, SSNs.' },
  { key: 'redactPhi', label: 'Redact PHI', description: 'Protected health information.' },
  { key: 'redactNumbers', label: 'Redact numbers', description: 'Dates, account numbers, and other numerals.' },
]

export const DEFAULT_STT_SETTINGS = Object.freeze({
  summarize: true,
  detectEntities: true,
  sentiment: true,
  smartFormat: true,
  diarize: true,
  punctuate: true,
  paragraphs: true,
  utterances: true,
  profanityFilter: true,
  fillerWords: true,
  numerals: true,
  redactPci: true,
  redactPii: true,
  redactPhi: true,
  redactNumbers: true,
})

export function normalizeSttSettings(input) {
  const base = { ...DEFAULT_STT_SETTINGS }

  if (input == null || typeof input !== 'object') {
    return base
  }

  for (const key of STT_SETTING_KEYS) {
    if (key in input) {
      base[key] = Boolean(input[key])
    }
  }

  if (base.paragraphs) {
    base.punctuate = true
  }

  return base
}

export function parseSttSettings(input) {
  if (input === undefined) {
    return undefined
  }
  return normalizeSttSettings(input)
}

/** Map scorecard language enum → Deepgram language code. */
export function scorecardLanguageToDeepgram(language) {
  switch (language) {
    case 'ARABIC':
      return 'ar'
    case 'FRENCH':
      return 'fr'
    default:
      return 'en'
  }
}

/** Build Deepgram listen API options from normalized sttSettings. */
export function buildDeepgramListenOptions(sttSettings, languageCode) {
  const settings = normalizeSttSettings(sttSettings)
  const redact = []

  if (settings.redactPci) redact.push('pci')
  if (settings.redactPii) redact.push('pii')
  if (settings.redactPhi) redact.push('phi')
  if (settings.redactNumbers) redact.push('numbers')

  const options = {
    model: 'nova-3',
    language: languageCode,
    smart_format: settings.smartFormat,
    diarize: settings.diarize,
    punctuate: settings.punctuate,
    paragraphs: settings.paragraphs,
    utterances: settings.utterances,
    profanity_filter: settings.profanityFilter,
    filler_words: settings.fillerWords,
    numerals: settings.numerals,
  }

  if (settings.summarize) options.summarize = 'v2'
  if (settings.detectEntities) options.detect_entities = true
  if (settings.sentiment) options.sentiment = true
  if (redact.length > 0) options.redact = redact

  return options
}
