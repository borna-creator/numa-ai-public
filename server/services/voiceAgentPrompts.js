import {
  DEFAULT_VOICE_AGENT_PROMPTS,
  VOICE_AGENT_LANGUAGE_VALUES,
} from '../../shared/voiceAgentPrompts.js'
import { prisma } from '../db.js'

function toApiPrompt(row) {
  return {
    language: row.language,
    systemPrompt: row.systemPrompt,
    greetingPrompt: row.greetingPrompt,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function seedVoiceAgentPrompts() {
  for (const language of VOICE_AGENT_LANGUAGE_VALUES) {
    const defaults = DEFAULT_VOICE_AGENT_PROMPTS[language]
    await prisma.voiceAgentPrompt.upsert({
      where: { language },
      create: {
        language,
        systemPrompt: defaults.systemPrompt,
        greetingPrompt: defaults.greetingPrompt,
      },
      update: {},
    })
  }
}

export async function listVoiceAgentPrompts() {
  const rows = await prisma.voiceAgentPrompt.findMany({
    orderBy: { language: 'asc' },
  })

  if (rows.length === VOICE_AGENT_LANGUAGE_VALUES.length) {
    return rows.map(toApiPrompt)
  }

  await seedVoiceAgentPrompts()
  const seeded = await prisma.voiceAgentPrompt.findMany({ orderBy: { language: 'asc' } })
  return seeded.map(toApiPrompt)
}

export async function getVoiceAgentPrompt(language) {
  let row = await prisma.voiceAgentPrompt.findUnique({ where: { language } })
  if (!row) {
    await seedVoiceAgentPrompts()
    row = await prisma.voiceAgentPrompt.findUnique({ where: { language } })
  }
  return row ? toApiPrompt(row) : null
}

export async function updateVoiceAgentPrompt(language, { systemPrompt, greetingPrompt }) {
  await seedVoiceAgentPrompts()

  const row = await prisma.voiceAgentPrompt.update({
    where: { language },
    data: { systemPrompt, greetingPrompt },
  })

  return toApiPrompt(row)
}
