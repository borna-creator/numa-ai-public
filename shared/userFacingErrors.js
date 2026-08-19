const VENDOR_PATTERN = /deepgram|deepinfra|deepseek/i

const TECHNICAL_PATTERN =
  /worker rejected|failed to dispatch|worker reported|json_schema|invalid json|missing .* array|empty transcript|empty content|finish_reason|\braw:|api\.deepinfra|api\.deepgram|DEEPGRAM_|DEEPINFRA_|DEEPSEEK_|WORKER_URL|not configured on the worker/i

export const USER_FACING_ERRORS = {
  default: 'Something went wrong. Please try again.',
  request: 'Request failed. Please try again.',
  processing: 'Unable to process this call. Please try again later.',
  scoring: 'Unable to score this call. Please try again later.',
  upload: 'Upload failed. Please try again.',
}

export function sanitizeUserFacingError(message, context = 'default') {
  const fallback = USER_FACING_ERRORS[context] || USER_FACING_ERRORS.default

  if (message == null || typeof message !== 'string') {
    return fallback
  }

  const trimmed = message.trim()
  if (!trimmed) {
    return fallback
  }

  if (VENDOR_PATTERN.test(trimmed) || TECHNICAL_PATTERN.test(trimmed)) {
    if (context === 'scoring' || /score|scoring|criterion|result/i.test(trimmed)) {
      return USER_FACING_ERRORS.scoring
    }
    if (context === 'upload') {
      return USER_FACING_ERRORS.upload
    }
    return USER_FACING_ERRORS.processing
  }

  if (/^request failed \(\d{3}\)$/i.test(trimmed)) {
    return USER_FACING_ERRORS.request
  }

  if (trimmed.length > 240 || /https?:\/\//i.test(trimmed)) {
    return fallback
  }

  return trimmed
}
