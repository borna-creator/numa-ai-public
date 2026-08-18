const SPEAKER_STYLES = [
  { border: 'border-l-numa-500', bg: 'bg-numa-50/70', badge: 'bg-numa-100 text-numa-800' },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-50/70', badge: 'bg-emerald-100 text-emerald-800' },
  { border: 'border-l-violet-500', bg: 'bg-violet-50/70', badge: 'bg-violet-100 text-violet-800' },
  { border: 'border-l-amber-500', bg: 'bg-amber-50/70', badge: 'bg-amber-100 text-amber-800' },
]

export function formatTranscriptTimestamp(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return ''
  const total = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function formatSpeakerLabel(speaker, role) {
  if (role) return role
  if (!speaker) return 'Speaker'
  const id = String(speaker).toLowerCase()
  if (id === 'agent') return 'Agent'
  if (id === 'caller') return 'Caller'
  const match = id.match(/^speaker_(\d+)$/)
  if (match) return `Speaker ${Number(match[1]) + 1}`
  return String(speaker)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getSpeakerRoleMap(transcript) {
  const segments = transcript?.segments
  if (!segments) return {}

  if (Array.isArray(segments)) {
    return transcript?.segmentsMeta?.speakerRoles ?? {}
  }

  return segments.speakerRoles ?? {}
}

function normalizeTurn(raw, roleMap) {
  const speakerKey = String(raw.speaker ?? 'unknown')
  const role = raw.role ?? roleMap[speakerKey] ?? null
  return {
    speakerKey,
    label: formatSpeakerLabel(raw.speaker, role),
    startSec: raw.startSec ?? raw.start ?? 0,
    endSec: raw.endSec ?? raw.end ?? null,
    text: (raw.text ?? raw.transcript ?? '').trim(),
  }
}

export function getSpeakerTurns(transcript) {
  if (!transcript) return []

  const segments = transcript.segments
  const roleMap = getSpeakerRoleMap(transcript)
  let raw = []

  if (segments && typeof segments === 'object' && !Array.isArray(segments)) {
    if (Array.isArray(segments.speakers) && segments.speakers.length > 0) {
      raw = segments.speakers
    } else if (Array.isArray(segments.utterances) && segments.utterances.length > 0) {
      raw = segments.utterances.map((u) => ({
        speaker: u.speaker,
        role: roleMap[u.speaker] ?? u.role ?? null,
        startSec: u.start,
        endSec: u.end,
        text: u.transcript,
      }))
    }
  } else if (Array.isArray(segments) && segments.length > 0) {
    raw = segments
  }

  return raw
    .map((item) => normalizeTurn(item, roleMap))
    .filter((turn) => turn.text)
    .sort((a, b) => a.startSec - b.startSec)
}

function buildSpeakerStyles(turns) {
  const styles = new Map()
  let index = 0
  for (const turn of turns) {
    if (!styles.has(turn.speakerKey)) {
      styles.set(turn.speakerKey, SPEAKER_STYLES[index % SPEAKER_STYLES.length])
      index += 1
    }
  }
  return styles
}

export default function CallTranscript({ transcript }) {
  const turns = getSpeakerTurns(transcript)

  if (turns.length === 0) {
    if (!transcript?.fullText) return null
    return (
      <div>
        <p className="text-sm font-medium text-slate-900 mb-2">Transcript</p>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
          {transcript.fullText}
        </div>
      </div>
    )
  }

  const speakerStyles = buildSpeakerStyles(turns)
  const legend = [...speakerStyles.entries()].map(([speakerKey, style]) => {
    const turn = turns.find((item) => item.speakerKey === speakerKey)
    return {
      speakerKey,
      label: turn?.label ?? formatSpeakerLabel(speakerKey),
      style,
    }
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-900">Transcript</p>
        {legend.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {legend.map(({ speakerKey, label, style }) => (
              <span
                key={speakerKey}
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white max-h-96 overflow-y-auto divide-y divide-slate-100">
        {turns.map((turn, index) => {
          const style = speakerStyles.get(turn.speakerKey)
          const timestamp = formatTranscriptTimestamp(turn.startSec)
          const endTimestamp =
            turn.endSec != null ? formatTranscriptTimestamp(turn.endSec) : null

          return (
            <div
              key={`${turn.startSec}-${turn.speakerKey}-${index}`}
              className={`border-l-4 px-4 py-3 ${style.border} ${style.bg}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {turn.label}
                </span>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {timestamp}
                  {endTimestamp && endTimestamp !== timestamp ? ` – ${endTimestamp}` : ''}
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">{turn.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
