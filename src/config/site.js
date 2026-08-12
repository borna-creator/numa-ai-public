export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://numaiq.com'

export const SITE = {
  name: 'NumaIQ',
  legalName: 'NumaIQ',
  tagline: 'AI Voice Agents & QA Platform',
  description:
    'NumaIQ deploys AI voice agents that sound human — making calls in English, Arabic, and French. Connect to your databases, handle compliance, and score every call with our built-in QA platform.',
  email: 'hello@numaiq.com',
  phone: '+971 52 739 8835',
  phoneTel: '+971527398835',
  address: {
    line1: 'IFZA Business Park',
    line2: '00000 — Dubai',
    country: 'United Arab Emirates',
  },
  locale: 'en_US',
  twitterHandle: '@numaiq',
}

export const SEO = {
  title: `${SITE.name} — AI Voice Agents & QA Platform`,
  description: SITE.description,
  ogImage: `${SITE_URL}/og_image.png`,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: 'NumaIQ — Voice agents that sound indistinguishable from humans',
  keywords: [
    'AI voice agents',
    'voice AI',
    'telephony',
    'call center automation',
    'QA platform',
    'compliance scoring',
    'Arabic voice AI',
    'French voice AI',
    'Dubai AI',
    'NumaIQ',
  ].join(', '),
}
