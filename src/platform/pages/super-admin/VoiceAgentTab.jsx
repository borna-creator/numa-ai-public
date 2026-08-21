import { useCallback, useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
import { api } from '../../api.js'
import { Alert, Button, Card, CardHeader, LoadingState } from '../../components/ui.jsx'

const STATUS = {
  idle: 'Ready to start a conversation',
  connecting: 'Connecting…',
  waiting: 'Connected — waiting for the assistant to join…',
  active: 'Connected — speak when ready',
  disconnecting: 'Ending session…',
}

function VoiceOrb({ active, speaking }) {
  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <div
        className={`absolute inset-0 rounded-full transition-all duration-500 ${
          active
            ? 'bg-gradient-to-br from-numa-500/20 to-cyan-500/20 animate-pulse'
            : 'bg-slate-100'
        }`}
      />
      <div
        className={`absolute inset-4 rounded-full transition-all duration-300 ${
          speaking
            ? 'bg-gradient-to-br from-numa-500 to-cyan-500 scale-105 shadow-lg shadow-numa-500/30'
            : active
              ? 'bg-gradient-to-br from-numa-600 to-cyan-600 shadow-md shadow-numa-500/20'
              : 'bg-slate-200'
        }`}
      />
      <div className="relative z-10 text-white">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a4.5 4.5 0 0 0 4.5-4.5V8.25a4.5 4.5 0 1 0-9 0v6a4.5 4.5 0 0 0 4.5 4.5Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v2.25m-4.5 0h9" />
        </svg>
      </div>
    </div>
  )
}

const STATUS_HINTS = {
  worker_url_missing: 'WORKER_URL is not set on the API server (VPS 1).',
  worker_secret_missing: 'WORKER_SECRET is not set on the API server (VPS 1).',
  worker_unreachable: 'The API server cannot reach the processing worker. Check WORKER_URL and firewall rules.',
  worker_unauthorized: 'WORKER_SECRET does not match between VPS 1 and VPS 2.',
  worker_outdated: 'The processing worker is running old code — git pull and restart on VPS 2.',
  worker_error: 'The processing worker returned an error. Check worker logs.',
  voice_not_configured: 'LiveKit credentials are missing on VPS 2.',
}

function attachRemoteAudio(track, container) {
  if (track.kind !== Track.Kind.Audio || !container) return
  const element = track.attach()
  element.autoplay = true
  element.playsInline = true
  element.setAttribute('playsinline', 'true')
  element.style.display = 'none'
  container.appendChild(element)
  element.play().catch(() => {
    // startAudio() on the room handles browser unlock in most cases
  })
}

function attachExistingRemoteAudio(room, container, onRemote) {
  for (const participant of room.remoteParticipants.values()) {
    onRemote(participant)
    for (const publication of participant.audioTrackPublications.values()) {
      if (publication.track) {
        attachRemoteAudio(publication.track, container)
      }
    }
  }
}

export default function VoiceAgentTab() {
  const roomRef = useRef(null)
  const audioContainerRef = useRef(null)
  const waitTimerRef = useRef(null)
  const assistantJoinedRef = useRef(false)
  const [available, setAvailable] = useState(null)
  const [agentConfigured, setAgentConfigured] = useState(true)
  const [statusHint, setStatusHint] = useState('')
  const [missingVars, setMissingVars] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [assistantJoined, setAssistantJoined] = useState(false)
  const [lines, setLines] = useState([])

  const appendLine = useCallback((role, text) => {
    const trimmed = text?.trim()
    if (!trimmed) return
    setLines((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, role, text: trimmed }])
  }, [])

  const clearWaitTimer = useCallback(() => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current)
      waitTimerRef.current = null
    }
  }, [])

  const markAssistantJoined = useCallback(
    (participant) => {
      assistantJoinedRef.current = true
      setAssistantJoined(true)
      setStatus('active')
      clearWaitTimer()
      appendLine('assistant', `Assistant connected${participant?.name ? ` (${participant.name})` : ''}.`)
    },
    [appendLine, clearWaitTimer],
  )

  const disconnect = useCallback(async () => {
    clearWaitTimer()
    const room = roomRef.current
    roomRef.current = null
    if (!room) return

    setStatus('disconnecting')
    try {
      room.removeAllListeners()
      await room.disconnect()
    } catch {
      // ignore cleanup errors
    }

    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = ''
    }

    setSpeaking(false)
    setAssistantJoined(false)
    assistantJoinedRef.current = false
    setStatus('idle')
  }, [clearWaitTimer])

  useEffect(() => {
    api('/api/voice/status')
      .then((data) => {
        setAvailable(Boolean(data.available))
        setAgentConfigured(data.agentConfigured !== false)
        setStatusHint(data.reason ? STATUS_HINTS[data.reason] || '' : '')
        setMissingVars(Array.isArray(data.missing) ? data.missing : [])
      })
      .catch(() => {
        setAvailable(false)
        setStatusHint('Could not reach the voice status endpoint. Deploy the latest API on VPS 1.')
      })
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const startSession = async () => {
    setError('')
    setStatus('connecting')
    setLines([])
    setAssistantJoined(false)
    assistantJoinedRef.current = false
    clearWaitTimer()

    try {
      const data = await api('/api/voice/session', { method: 'POST' })
      const { session } = data
      if (!session?.connectUrl || !session?.accessToken) {
        throw new Error('Voice assistant is not available right now.')
      }

      const agent = session.agent ?? {}
      if (!agent.configured) {
        appendLine(
          'system',
          'No voice agent is configured. Set LIVEKIT_AGENT_NAME on VPS 2 to match your deployed agent.',
        )
      } else if (!agent.dispatched) {
        appendLine(
          'system',
          'Could not dispatch the voice agent. Check LIVEKIT_AGENT_NAME and worker logs on VPS 2.',
        )
      } else {
        appendLine('system', `Dispatching voice agent${agent.name ? ` (${agent.name})` : ''}…`)
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      roomRef.current = room

      const handleRemoteParticipant = (participant) => {
        if (participant.isLocal) return
        markAssistantJoined(participant)
      }

      room.on(RoomEvent.Connected, async () => {
        appendLine('system', 'You are connected. Enabling microphone…')
        try {
          await room.localParticipant.setMicrophoneEnabled(true)
          await room.startAudio()
          appendLine('system', 'Microphone is live. Say hello when the assistant joins.')
        } catch (micErr) {
          appendLine('system', 'Microphone access failed. Allow mic permission in your browser and try again.')
          throw micErr
        }

        attachExistingRemoteAudio(room, audioContainerRef.current, handleRemoteParticipant)

        if (room.remoteParticipants.size === 0) {
          setStatus('waiting')
          waitTimerRef.current = setTimeout(() => {
            if (!assistantJoinedRef.current) {
              appendLine(
                'system',
                'The assistant has not joined yet. Confirm your agent worker is running and LIVEKIT_AGENT_NAME matches.',
              )
            }
          }, 15000)
        }
      })

      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current === room) {
          roomRef.current = null
          setStatus('idle')
          setSpeaking(false)
          setAssistantJoined(false)
          clearWaitTimer()
        }
      })

      room.on(RoomEvent.ParticipantConnected, handleRemoteParticipant)

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (participant.isLocal) return
        attachRemoteAudio(track, audioContainerRef.current)
        markAssistantJoined(participant)
      })

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const remoteSpeaking = speakers.some((p) => !p.isLocal)
        setSpeaking(remoteSpeaking)
      })

      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        const text = segments.map((s) => s.text).join(' ').trim()
        if (!text) return
        appendLine(participant?.isLocal ? 'you' : 'assistant', text)
      })

      room.on(RoomEvent.MediaDevicesError, () => {
        appendLine('system', 'Could not access your microphone. Check browser permissions.')
      })

      await room.connect(session.connectUrl, session.accessToken, { autoSubscribe: true })
    } catch (err) {
      await disconnect()
      setError(err.message || 'Unable to start the voice session.')
      setStatus('idle')
    }
  }

  if (available === null) {
    return <LoadingState label="Checking voice assistant…" />
  }

  const isActive = status === 'active' || status === 'connecting' || status === 'waiting'
  const busy = status === 'connecting' || status === 'disconnecting'

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {!available && (
        <Alert variant="warning">
          <p>Voice assistant is not available yet.</p>
          {statusHint && <p className="mt-2">{statusHint}</p>}
          {missingVars.length > 0 && (
            <p className="mt-2">
              Missing on VPS 2: <span className="font-mono text-xs">{missingVars.join(', ')}</span>
            </p>
          )}
        </Alert>
      )}

      {available && !agentConfigured && (
        <Alert variant="warning">
          LIVEKIT_AGENT_NAME is not set on VPS 2. You can connect, but no assistant will join the
          session until it matches your deployed agent name.
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Voice assistant"
          description="Talk to the Numa voice agent in real time. Sessions are private to super admins."
        />

        <div className="flex flex-col items-center gap-6 py-4">
          <VoiceOrb active={isActive} speaking={speaking} />
          <p className="text-sm font-medium text-slate-600">{STATUS[status] || status}</p>
          {isActive && (
            <p className="text-xs text-slate-500">
              {assistantJoined ? 'Assistant is in the session' : 'Waiting for the assistant to join…'}
            </p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {!isActive ? (
              <Button onClick={startSession} disabled={!available || busy} size="lg">
                Start conversation
              </Button>
            ) : (
              <Button variant="danger" onClick={disconnect} disabled={busy} size="lg">
                End conversation
              </Button>
            )}
          </div>
        </div>

        <div ref={audioContainerRef} aria-hidden="true" />

        {lines.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Session log</p>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className={`text-sm px-3 py-2 rounded-xl ${
                    line.role === 'assistant'
                      ? 'bg-numa-50 text-numa-900'
                      : line.role === 'you'
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-slate-50 text-slate-500 italic'
                  }`}
                >
                  {line.role === 'assistant' && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-numa-600 mr-2">
                      Assistant
                    </span>
                  )}
                  {line.role === 'you' && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mr-2">
                      You
                    </span>
                  )}
                  {line.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}
