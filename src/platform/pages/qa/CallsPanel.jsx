import { useEffect, useState, useCallback } from 'react'
import { api, formatFileSize, uploadFile, formatDateTime } from '../../api.js'
import { CallStatusBadge } from '../../components/CallStatusBadge.jsx'
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
      if (uploaded.length > 0) {
        setSelectedCallId(uploaded[0].id)
      }
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
    return <p className="text-slate-500 text-sm">Loading calls…</p>
  }

  const audioSrc = selectedCall ? `${apiBase}/calls/${selectedCall.id}/audio` : null
  const canProcess =
    selectedCall &&
    selectedCall.scorecardId &&
    ['PENDING', 'FAILED', 'COMPLETED'].includes(selectedCall.status)

  const processingCount = calls.filter((c) => c.status === 'PROCESSING').length

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <form onSubmit={handleUpload} className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Upload calls</h3>
        <p className="text-sm text-slate-500">
          Select one or more files (MP3, WAV, M4A, OGG, WEBM). Choose a scorecard to score all uploads automatically.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <select
            value={uploadForm.scorecardId}
            onChange={(e) => setUploadForm({ ...uploadForm, scorecardId: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
          >
            <option value="">Scorecard (optional)</option>
            {scorecards.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {(canDeleteAny || departments.length > 0) && (
            <select
              value={uploadForm.departmentId}
              onChange={(e) => setUploadForm({ ...uploadForm, departmentId: e.target.value })}
              disabled={!canDeleteAny && Boolean(userDepartmentId)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30 disabled:bg-slate-50"
            >
              <option value="">Department (optional)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
            multiple
            required
            onChange={(e) =>
              setUploadForm({ ...uploadForm, files: [...(e.target.files || [])] })
            }
            className="sm:col-span-2 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-numa-50 file:text-numa-700 file:font-semibold"
          />
          {uploadForm.files.length > 0 && (
            <p className="sm:col-span-2 text-xs text-slate-500">
              {uploadForm.files.length} file{uploadForm.files.length === 1 ? '' : 's'} selected
              {' · '}
              {formatFileSize(uploadForm.files.reduce((sum, f) => sum + f.size, 0))} total
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700 disabled:opacity-60"
        >
          {uploading
            ? 'Uploading…'
            : uploadForm.files.length > 1
              ? `Upload ${uploadForm.files.length} calls`
              : 'Upload call'}
        </button>
      </form>

      {processingCount > 0 && (
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          {processingCount} call{processingCount === 1 ? ' is' : 's are'} being scored — status updates automatically.
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Calls</h3>
          </div>
          {calls.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No calls uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {calls.map((call) => (
                <li key={call.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCallId(call.id)}
                    className={`w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors ${
                      selectedCallId === call.id ? 'bg-numa-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{call.originalName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDateTime(call.createdAt)} · {formatFileSize(call.fileSize)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {call.scorecard?.name || 'No scorecard'}
                          {call.department?.name ? ` · ${call.department.name}` : ''}
                          {call.overallScore != null ? ` · Score ${call.overallScore}%` : ''}
                        </p>
                      </div>
                      <CallStatusBadge status={call.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 min-h-[280px]">
          {!selectedCall ? (
            <p className="text-sm text-slate-500">Select a call to view details and playback.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 break-all">{selectedCall.originalName}</h3>
                  <p className="text-sm text-slate-500 mt-1">Uploaded {formatDateTime(selectedCall.createdAt)}</p>
                </div>
                <CallStatusBadge status={selectedCall.status} />
              </div>

              {selectedCall.overallScore != null && (
                <div className="rounded-xl bg-numa-50 border border-numa-100 px-4 py-3">
                  <p className="text-xs font-semibold text-numa-700 uppercase tracking-wide">Overall score</p>
                  <p className="text-3xl font-bold text-numa-900 mt-1">{selectedCall.overallScore}%</p>
                </div>
              )}

              {selectedCall.status === 'FAILED' && selectedCall.errorMessage && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {selectedCall.errorMessage}
                </div>
              )}

              {selectedCall.status === 'PROCESSING' && (
                <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  Scoring in progress… this page refreshes automatically.
                </p>
              )}

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Uploaded by</dt>
                  <dd className="font-medium text-slate-900">
                    {getUserDisplayName(selectedCall.uploadedBy)}
                    {selectedCall.uploadedBy.jobTitle && (
                      <span className="text-slate-500 font-normal"> · {selectedCall.uploadedBy.jobTitle}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Size</dt>
                  <dd className="font-medium text-slate-900">{formatFileSize(selectedCall.fileSize)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Scorecard</dt>
                  <dd className="font-medium text-slate-900">{selectedCall.scorecard?.name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Department</dt>
                  <dd className="font-medium text-slate-900">{selectedCall.department?.name || '—'}</dd>
                </div>
              </dl>

              {selectedCall.results?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Criterion scores</p>
                  <ul className="space-y-2">
                    {selectedCall.results.map((r) => (
                      <li key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-slate-900">{r.criterion.label}</span>
                          <span
                            className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              r.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {r.value}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {getCriterionQuestionTypeLabel(r.criterion.questionType)}
                        </p>
                        {r.reasoning && <p className="text-slate-600 mt-2 text-xs leading-relaxed">{r.reasoning}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(() => {
                const meta = getTranscriptMeta(selectedCall.transcript)
                if (!meta?.summary && !meta?.sentiment) return null
                return (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-2">
                    {meta.summary && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Summary</p>
                        <p className="text-sm text-slate-700 mt-1 leading-relaxed">{meta.summary}</p>
                      </div>
                    )}
                    {meta.sentiment && (
                      <p className="text-xs text-slate-500">
                        Overall sentiment:{' '}
                        <span className="font-medium text-slate-700 capitalize">{meta.sentiment}</span>
                        {meta.sentimentScore != null && (
                          <span className="text-slate-400"> ({meta.sentimentScore.toFixed(2)})</span>
                        )}
                      </p>
                    )}
                  </div>
                )
              })()}

              {selectedCall.transcript?.fullText && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Transcript</p>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedCall.transcript.fullText}
                  </div>
                </div>
              )}

              {selectedCall.scorecard?.criteria?.length > 0 && !selectedCall.results?.length && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Scorecard criteria</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {selectedCall.scorecard.criteria.map((c) => (
                      <li key={c.id}>
                        • {c.label}
                        <span className="text-slate-400 ml-1">
                          ({getCriterionQuestionTypeLabel(c.questionType)})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <audio controls className="w-full" src={audioSrc}>
                Your browser does not support audio playback.
              </audio>

              <div className="flex flex-wrap gap-3">
                {canProcess && (
                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-numa-600 hover:bg-numa-700 disabled:opacity-60"
                  >
                    {processing
                      ? 'Starting…'
                      : selectedCall.status === 'COMPLETED'
                        ? 'Re-score call'
                        : 'Start scoring'}
                  </button>
                )}
                {(canDeleteAny || selectedCall.uploadedBy.id === currentUserId) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedCall)}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Delete call
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
