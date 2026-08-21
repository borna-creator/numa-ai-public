import { useCallback, useEffect, useRef, useState } from 'react'
import { LogLevel, Room, RoomEvent, Track, setLogLevel } from 'livekit-client'
import { api, userFacingError } from '../../api.js'
import { Alert, Button, Card, CardHeader, LoadingState } from '../../components/ui.jsx'

setLogLevel(LogLevel.silent)

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
  worker_url_missing: 'Voice assistant is not available right now. Contact your administrator.',
  worker_secret_missing: 'Voice assistant is not available right now. Contact your administrator.',
  worker_unreachable: 'Voice assistant is not available right now. Please try again later.',
  worker_unauthorized: 'Voice assistant is not available right now. Contact your administrator.',
  worker_outdated: 'Voice assistant is not available right now. Contact your administrator.',
  worker_error: 'Voice assistant is not available right now. Please try again later.',
  voice_not_configured: 'Voice assistant is not configured yet. Contact your administrator.',
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
    (_participant) => {
      assistantJoinedRef.current = true
      setAssistantJoined(true)
      setStatus('active')
      clearWaitTimer()
      appendLine('assistant', 'Assistant connected.')
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
      })
      .catch(() => {
        setAvailable(false)
        setStatusHint('Voice assistant is not available right now.')
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
        appendLine('system', 'Voice assistant is not fully configured. Contact your administrator.')
      } else if (!agent.dispatched) {
        appendLine('system', 'Unable to reach the voice assistant. Please try again later.')
      } else {
        appendLine('system', 'Connecting to the voice assistant…')
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
                'The assistant has not joined yet. Please try again in a moment.',
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
      setError(userFacingError(err, 'default'))
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
        </Alert>
      )}

      {available && !agentConfigured && (
        <Alert variant="warning">
          Voice assistant is not fully configured. You can connect, but the assistant may not join.
          Contact your administrator.
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
