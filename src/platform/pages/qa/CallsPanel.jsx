import { useEffect, useState, useCallback } from 'react'
import { api, formatFileSize, uploadFile, formatDateTime } from '../../api.js'
import { CallStatusBadge } from '../../components/CallStatusBadge.jsx'
import CallTranscript from '../../components/CallTranscript.jsx'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconPhone,
  IconUpload,
  LoadingState,
  ScoreRing,
  Select,
  StatCard,
} from '../../components/ui.jsx'
import { getUserDisplayName } from '../../../../shared/userProfile.js'
import { getCriterionQuestionTypeLabel } from '../../../../shared/criterionQuestionTypes.js'

function getTranscriptMeta(transcript) {
  const segments = transcript?.segments
  if (!segments || Array.isArray(segments)) return null

  const rawSentiment = segments.sentiment
  let sentiment = null
  let sentimentScore = null

  if (rawSentiment && typeof rawSentiment === 'object') {
    if (typeof rawSentiment.average === 'string') {
      sentiment = rawSentiment.average
      sentimentScore = rawSentiment.sentiment_score ?? null
    } else if (rawSentiment.average && typeof rawSentiment.average === 'object') {
      sentiment = rawSentiment.average.sentiment ?? null
      sentimentScore = rawSentiment.average.sentiment_score ?? null
    } else if (typeof rawSentiment.sentiment === 'string') {
      sentiment = rawSentiment.sentiment
      sentimentScore = rawSentiment.sentiment_score ?? null
    }
  } else if (typeof rawSentiment === 'string') {
    sentiment = rawSentiment
  }

  return {
    summary: segments.summary ?? null,
    sentiment,
    sentimentScore,
    speakerCount: Array.isArray(segments.speakers) ? segments.speakers.length : 0,
  }
}

export default function CallsPanel({
  apiBase,
  canDeleteAny = false,
  userDepartmentId = null,
  currentUserId = null,
}) {
  const [calls, setCalls] = useState([])
  const [scorecards, setScorecards] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [selectedCallId, setSelectedCallId] = useState(null)
  const [selectedCall, setSelectedCall] = useState(null)
  const [uploadForm, setUploadForm] = useState({
    scorecardId: '',
    departmentId: userDepartmentId || '',
    files: [],
  })

  const load = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true)
      const [callsData, scorecardsData, deptData] = await Promise.all([
        api(`${apiBase}/calls`),
        api(`${apiBase}/scorecards`),
        canDeleteAny
          ? api(`${apiBase}/departments`)
          : Promise.resolve({ departments: [] }),
      ])
      setCalls(callsData.calls)
      setScorecards(scorecardsData.scorecards.filter((s) => s.isActive))
      setDepartments(deptData.departments)
    } catch (err) {
      setError(err.message)
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  const refreshSelectedCall = useCallback(async () => {
    if (!selectedCallId) return
    try {
      const data = await api(`${apiBase}/calls/${selectedCallId}`)
      setSelectedCall(data.call)
      setCalls((prev) => prev.map((c) => (c.id === data.call.id ? { ...c, ...data.call } : c)))
    } catch (err) {
      setError(err.message)
    }
  }, [apiBase, selectedCallId])

  useEffect(() => {
    load()
  }, [apiBase])

  useEffect(() => {
    if (!selectedCallId) {
      setSelectedCall(null)
      return
    }
    refreshSelectedCall()
  }, [apiBase, selectedCallId, refreshSelectedCall])

  useEffect(() => {
    if (!selectedCall || selectedCall.status !== 'PROCESSING') return undefined
    const interval = setInterval(refreshSelectedCall, 4000)
    return () => clearInterval(interval)
  }, [selectedCall?.status, selectedCall?.id, refreshSelectedCall])

  const hasProcessingCalls = calls.some((c) => c.status === 'PROCESSING')

  useEffect(() => {
    if (!hasProcessingCalls) return undefined
    const interval = setInterval(() => load(false), 4000)
    return () => clearInterval(interval)
  }, [hasProcessingCalls, apiBase])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (uploadForm.files.length === 0) {
      setError('Choose at least one audio file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      for (const file of uploadForm.files) {
        formData.append('audio', file)
      }
      if (uploadForm.scorecardId) formData.append('scorecardId', uploadForm.scorecardId)
      if (uploadForm.departmentId) formData.append('departmentId', uploadForm.departmentId)

      const data = await uploadFile(`${apiBase}/calls`, formData)
      const uploaded = data.calls ?? (data.call ? [data.call] : [])

      if (data.errors?.length) {
        const failedNames = data.errors.map((item) => item.fileName).join(', ')
        setError(`Some files failed: ${failedNames}`)
      }

      setUploadForm({ scorecardId: '', departmentId: userDepartmentId || '', files: [] })
      e.target.reset()
      await load()
      if (uploaded.length > 0) setSelectedCallId(uploaded[0].id)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleProcess = async () => {
    if (!selectedCall) return
    setProcessing(true)
    setError('')
    try {
      const data = await api(`${apiBase}/calls/${selectedCall.id}/process`, { method: 'POST' })
      setSelectedCall(data.call)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (call) => {
    if (!window.confirm(`Delete call "${call.originalName}"?`)) return
    setError('')
    try {
      await api(`${apiBase}/calls/${call.id}`, { method: 'DELETE' })
      if (selectedCallId === call.id) setSelectedCallId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <LoadingState label="Loading calls…" />
  }

  const audioSrc = selectedCall ? `${apiBase}/calls/${selectedCall.id}/audio` : null
  const canProcess =
    selectedCall &&
    selectedCall.scorecardId &&
    ['PENDING', 'FAILED', 'COMPLETED'].includes(selectedCall.status)

  const processingCount = calls.filter((c) => c.status === 'PROCESSING').length
  const completedCalls = calls.filter((c) => c.status === 'COMPLETED' && c.overallScore != null)
  const avgScore =
    completedCalls.length > 0
      ? Math.round(completedCalls.reduce((sum, c) => sum + c.overallScore, 0) / completedCalls.length)
      : null

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total calls" value={calls.length} tone="default" />
        <StatCard label="Completed" value={completedCalls.length} tone="success" />
        <StatCard label="In progress" value={processingCount} tone={processingCount ? 'warning' : 'default'} />
        <StatCard label="Avg score" value={avgScore != null ? `${avgScore}%` : '—'} tone="brand" />
      </div>

      <Card>
        <CardHeader
          title="Upload calls"
          description="Drop in recordings to transcribe and score against a scorecard. Supports MP3, WAV, M4A, OGG, and WEBM."
        />
        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Scorecard"
              value={uploadForm.scorecardId}
              onChange={(e) => setUploadForm({ ...uploadForm, scorecardId: e.target.value })}
            >
              <option value="">Optional — upload without scoring</option>
              {scorecards.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            {(canDeleteAny || departments.length > 0) && (
              <Select
                label="Department"
                value={uploadForm.departmentId}
                onChange={(e) => setUploadForm({ ...uploadForm, departmentId: e.target.value })}
                disabled={!canDeleteAny && Boolean(userDepartmentId)}
              >
                <option value="">Optional</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            )}
          </div>

          <label className="block cursor-pointer group">
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center transition-colors group-hover:border-numa-300 group-hover:bg-numa-50/30">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-numa-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <IconUpload />
              </div>
              <p className="text-sm font-semibold text-slate-800">Choose audio files</p>
              <p className="text-xs text-slate-500 mt-1">Click to browse or drag files here</p>
              {uploadForm.files.length > 0 && (
                <p className="text-xs font-medium text-numa-700 mt-3">
                  {uploadForm.files.length} file{uploadForm.files.length === 1 ? '' : 's'} ·{' '}
                  {formatFileSize(uploadForm.files.reduce((sum, f) => sum + f.size, 0))}
                </p>
              )}
            </div>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
              multiple
              required
              className="sr-only"
              onChange={(e) => setUploadForm({ ...uploadForm, files: [...(e.target.files || [])] })}
            />
          </label>

          <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
            {uploading
              ? 'Uploading…'
              : uploadForm.files.length > 1
                ? `Upload ${uploadForm.files.length} calls`
                : 'Upload call'}
          </Button>
        </form>
      </Card>

      {processingCount > 0 && (
        <Alert variant="info">
          {processingCount} call{processingCount === 1 ? ' is' : 's are'} being scored — results refresh automatically.
        </Alert>
      )}

      <div className="grid xl:grid-cols-5 gap-6">
        <Card padding={false} className="xl:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-900">Call library</h3>
            <p className="text-xs text-slate-500 mt-0.5">{calls.length} recording{calls.length === 1 ? '' : 's'}</p>
          </div>
          {calls.length === 0 ? (
            <EmptyState
              icon={IconPhone}
              title="No calls yet"
              description="Upload your first recording to start transcribing and scoring."
            />
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {calls.map((call) => {
                const selected = selectedCallId === call.id
                return (
                  <li key={call.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCallId(call.id)}
                      className={`w-full text-left px-5 py-4 transition-all border-l-[3px] ${
                        selected
                          ? 'bg-numa-50/60 border-l-numa-500'
                          : 'border-l-transparent hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate text-sm">{call.originalName}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDateTime(call.createdAt)} · {formatFileSize(call.fileSize)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {call.scorecard?.name || 'No scorecard'}
                            {call.department?.name ? ` · ${call.department.name}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <CallStatusBadge status={call.status} />
                          {call.overallScore != null && (
                            <span className="text-xs font-bold text-numa-700 tabular-nums">{call.overallScore}%</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="xl:col-span-3 min-h-[480px]">
          {!selectedCall ? (
            <EmptyState
              icon={IconPhone}
              title="Select a call"
              description="Choose a recording from the library to review scores, transcript, and playback."
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <CallStatusBadge status={selectedCall.status} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 break-all tracking-tight">{selectedCall.originalName}</h3>
                  <p className="text-sm text-slate-500 mt-1">Uploaded {formatDateTime(selectedCall.createdAt)}</p>
                </div>
                {selectedCall.overallScore != null && <ScoreRing score={selectedCall.overallScore} />}
              </div>

              {selectedCall.status === 'FAILED' && selectedCall.errorMessage && (
                <Alert variant="error">{selectedCall.errorMessage}</Alert>
              )}

              {selectedCall.status === 'PROCESSING' && (
                <Alert variant="info">Scoring in progress — this view updates automatically.</Alert>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Uploaded by', getUserDisplayName(selectedCall.uploadedBy)],
                  ['Size', formatFileSize(selectedCall.fileSize)],
                  ['Scorecard', selectedCall.scorecard?.name || '—'],
                  ['Department', selectedCall.department?.name || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-900 mt-0.5 truncate" title={value}>{value}</p>
                  </div>
                ))}
              </div>

              {selectedCall.results?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Criterion scores</h4>
                  <ul className="space-y-2.5">
                    {selectedCall.results.map((r) => (
                      <li
                        key={r.id}
                        className={`rounded-xl border px-4 py-3.5 ${
                          r.passed
                            ? 'border-emerald-100 bg-emerald-50/40'
                            : 'border-red-100 bg-red-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{r.criterion.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {getCriterionQuestionTypeLabel(r.criterion.questionType)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                              r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.value}
                          </span>
                        </div>
                        {r.reasoning && (
                          <p className="text-slate-600 mt-2.5 text-xs leading-relaxed border-t border-black/5 pt-2.5">
                            {r.reasoning}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(() => {
                const meta = getTranscriptMeta(selectedCall.transcript)
                if (!meta?.summary && !meta?.sentiment) return null
                return (
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 space-y-3">
                    {meta.summary && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">AI summary</p>
                        <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{meta.summary}</p>
                      </div>
                    )}
                    {meta.sentiment && (
                      <p className="text-xs text-slate-500">
                        Overall sentiment{' '}
                        <span className="font-semibold text-slate-800 capitalize">{meta.sentiment}</span>
                        {meta.sentimentScore != null && (
                          <span className="text-slate-400"> ({meta.sentimentScore.toFixed(2)})</span>
                        )}
                      </p>
                    )}
                  </div>
                )
              })()}

              {selectedCall.transcript && <CallTranscript transcript={selectedCall.transcript} />}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <audio controls className="w-full h-10" src={audioSrc}>
                  Your browser does not support audio playback.
                </audio>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {canProcess && (
                  <Button onClick={handleProcess} disabled={processing}>
                    {processing
                      ? 'Starting…'
                      : selectedCall.status === 'COMPLETED'
                        ? 'Re-score call'
                        : 'Start scoring'}
                  </Button>
                )}
                {(canDeleteAny || selectedCall.uploadedBy.id === currentUserId) && (
                  <Button variant="danger" onClick={() => handleDelete(selectedCall)}>
                    Delete call
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
