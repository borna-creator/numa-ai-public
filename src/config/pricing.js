export const PRICING_LAST_UPDATED = '19 February 2025'

export const PRICING_PLANS = [
  {
    id: 'answer',
    name: 'Answer',
    audience: 'SME / single-use',
    price: '$190',
    priceSuffix: '/mo',
    priceNote: null,
    annualDiscount: '−15%',
    highlighted: false,
    cta: 'Get started',
    ctaHref: '/#contact',
  },
  {
    id: 'convert',
    name: 'Convert',
    audience: 'Multi-channel SMB',
    price: '$890',
    priceSuffix: '/mo',
    priceNote: null,
    annualDiscount: '−15%',
    highlighted: true,
    cta: 'Get started',
    ctaHref: '/#contact',
  },
  {
    id: 'scale',
    name: 'Scale',
    audience: 'Groups / multi-site',
    price: '$2,400',
    priceSuffix: '/mo',
    priceNote: null,
    annualDiscount: '−20%',
    highlighted: false,
    cta: 'Talk to sales',
    ctaHref: '/#contact',
  },
  {
    id: 'custom',
    name: 'Custom',
    audience: 'Enterprise',
    price: 'Quote',
    priceSuffix: '',
    priceNote: 'Tailored to your operation',
    annualDiscount: 'Negotiated',
    highlighted: false,
    cta: 'Contact sales',
    ctaHref: '/#contact',
  },
]

/** Row values: true = included, false = not included, string = custom text */
export const PRICING_COMPARISON = [
  {
    label: 'Included minutes / month',
    values: { answer: '500', convert: '3,000', scale: '10,000', custom: 'Unlimited (negotiated)' },
  },
  {
    label: 'Overage rate',
    values: { answer: '$0.39/min', convert: '$0.39/min', scale: '$0.39/min', custom: 'Negotiated' },
  },
  {
    label: 'Prepaid annual discount',
    values: { answer: '−15%', convert: '−15%', scale: '−20%', custom: 'Negotiated' },
  },
  {
    label: 'Usage alerts',
    values: {
      answer: '80% then 100%',
      convert: '80% then 100%',
      scale: '80% then 100% + CSM review',
      custom: 'Custom',
    },
  },
  {
    label: 'Simultaneous calls*',
    values: { answer: '3', convert: '10', scale: '25+ (negotiated)', custom: 'Negotiated' },
  },
  {
    label: 'Setup fee',
    values: { answer: 'None', convert: '$1,000 (one-time)', scale: '$1,000 (one-time)', custom: 'Negotiated' },
  },
  {
    label: 'EN / AR / FR languages',
    values: { answer: true, convert: true, scale: true, custom: 'Included + early access' },
  },
  {
    label: 'Database connection',
    values: { answer: false, convert: true, scale: true, custom: 'Included (multi-system)' },
  },
  {
    label: 'ERP integration',
    values: {
      answer: false,
      convert: 'On request',
      scale: 'On request',
      custom: 'On request',
    },
  },
  {
    label: 'QA & compliance scoring',
    values: { answer: false, convert: true, scale: true, custom: 'Included + dedicated audit' },
  },
  {
    label: 'Enterprise security protocols',
    values: { answer: false, convert: false, scale: true, custom: 'Included + data residency' },
  },
  {
    label: 'ESG reporting',
    values: {
      answer: false,
      convert: 'Quarterly summary',
      scale: 'Detailed report',
      custom: 'Custom report',
    },
  },
  {
    label: 'Support',
    values: {
      answer: 'Self-service',
      convert: 'Priority',
      scale: 'Dedicated account mgr',
      custom: 'Single point of contact',
    },
  },
  {
    label: 'Founders offer (first 10 clients)',
    values: {
      answer: '−30% for life',
      convert: '−30% for life',
      scale: 'On discussion',
      custom: '—',
    },
  },
]

export const PRICING_FOOTNOTES = [
  '* Simultaneous calls = maximum concurrent active calls at any moment.',
]
