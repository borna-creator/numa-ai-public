import { useCallback, useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
import { api } from '../../api.js'
import { Alert, Button, Card, CardHeader, LoadingState } from '../../components/ui.jsx'

const STATUS = {
  idle: 'Ready to start a conversation',
  connecting: 'Connecting…',
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

export default function VoiceAgentTab() {
  const roomRef = useRef(null)
  const audioContainerRef = useRef(null)
  const [available, setAvailable] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [lines, setLines] = useState([])

  const appendLine = useCallback((role, text) => {
    const trimmed = text?.trim()
    if (!trimmed) return
    setLines((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, role, text: trimmed }])
  }, [])

  const disconnect = useCallback(async () => {
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
    setStatus('idle')
  }, [])

  useEffect(() => {
    api('/api/voice/status')
      .then((data) => setAvailable(Boolean(data.available)))
      .catch(() => setAvailable(false))
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

    try {
      const data = await api('/api/voice/session', { method: 'POST' })
      const { session } = data
      if (!session?.connectUrl || !session?.accessToken) {
        throw new Error('Voice assistant is not available right now.')
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })
      roomRef.current = room

      room.on(RoomEvent.Connected, () => {
        setStatus('active')
      })

      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current === room) {
          roomRef.current = null
          setStatus('idle')
          setSpeaking(false)
        }
      })

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind !== Track.Kind.Audio || !audioContainerRef.current) return
        const element = track.attach()
        element.autoplay = true
        audioContainerRef.current.appendChild(element)
        if (!participant.isLocal) {
          appendLine('assistant', 'Assistant joined — listening…')
        }
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

      await room.connect(session.connectUrl, session.accessToken)
      await room.localParticipant.setMicrophoneEnabled(true)
      appendLine('system', 'Session started. Your microphone is live.')
    } catch (err) {
      await disconnect()
      setError(err.message)
      setStatus('idle')
    }
  }

  if (available === null) {
    return <LoadingState label="Checking voice assistant…" />
  }

  const isActive = status === 'active' || status === 'connecting'
  const busy = status === 'connecting' || status === 'disconnecting'

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {!available && (
        <Alert variant="warning">
          Voice assistant is not configured yet. Add your voice credentials on the processing server and
          restart the worker.
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

        <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

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
