import { VOICE_AGENT_LANGUAGE_VALUES } from './voiceAgents.js'

export const VOICE_PROMPT_MAX_SYSTEM_CHARS = 16_000
export const VOICE_PROMPT_MAX_GREETING_CHARS = 2_000

export const DEFAULT_VOICE_AGENT_PROMPTS = {
  ENGLISH: {
    systemPrompt: `You are a friendly and reliable voice assistant built by Numa IQ. You help users by answering questions clearly and conversationally in English.

Output rules:
- Respond in English only.
- Use plain text only. No JSON, markdown, lists, code, or emojis.
- Keep responses short: one to three sentences. Ask one question at a time.
- Be polite and conversational.`,
    greetingPrompt: 'Greet the user warmly in English and offer your help.',
  },
  FRENCH: {
    systemPrompt: `Vous êtes un assistant vocal amical et fiable conçu par Numa IQ. Vous répondez aux questions et expliquez des sujets en français.

Règles de sortie:
- Répondez uniquement en français.
- Texte brut uniquement. Pas de JSON, markdown, listes, code ou émojis.
- Réponses courtes: une à trois phrases. Une seule question à la fois.
- Soyez poli et conversationnel.`,
    greetingPrompt: "Saluez l'utilisateur en français et proposez votre aide.",
  },
  ARABIC: {
    systemPrompt: `أنت مساعد صوتي ودود وموثوق من Numa IQ. تجيب على الأسئلة وتوضح المواضيع باللغة العربية الفصحى.

قواعد الإخراج:
- أجب باللغة العربية فقط. لا تستخدم الفرنسية أو الإنجليزية.
- استخدم نصاً عادياً فقط. لا JSON ولا markdown ولا قوائم ولا رموز.
- اجعل الإجابات قصيرة: جملة إلى ثلاث جمل. اسأل سؤالاً واحداً في كل مرة.
- كن مهذباً ومحادثاً بشكل طبيعي.`,
    greetingPrompt: 'رحّب بالمستخدم بالعربية وعرّف بنفسك واعرض مساعدتك.',
  },
}

export function isValidVoicePromptLanguage(value) {
  return VOICE_AGENT_LANGUAGE_VALUES.includes(value)
}

export function normalizeVoicePromptFields({ systemPrompt, greetingPrompt }) {
  const system = systemPrompt?.trim() ?? ''
  const greeting = greetingPrompt?.trim() ?? ''

  if (!system) {
    return { error: 'System prompt is required' }
  }
  if (!greeting) {
    return { error: 'Greeting prompt is required' }
  }
  if (system.length > VOICE_PROMPT_MAX_SYSTEM_CHARS) {
    return { error: `System prompt must be at most ${VOICE_PROMPT_MAX_SYSTEM_CHARS} characters` }
  }
  if (greeting.length > VOICE_PROMPT_MAX_GREETING_CHARS) {
    return { error: `Greeting prompt must be at most ${VOICE_PROMPT_MAX_GREETING_CHARS} characters` }
  }

  return { systemPrompt: system, greetingPrompt: greeting }
}

export function serializeVoicePromptMetadata({ systemPrompt, greetingPrompt }) {
  return JSON.stringify({
    systemPrompt,
    greetingPrompt,
  })
}
