import { useEffect, useState } from 'react'
import { api, formatFileSize, uploadFile, formatDateTime } from '../../api.js'
import { CallStatusBadge } from '../../components/CallStatusBadge.jsx'

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
  const [error, setError] = useState('')
  const [selectedCallId, setSelectedCallId] = useState(null)
  const [selectedCall, setSelectedCall] = useState(null)
  const [uploadForm, setUploadForm] = useState({
    scorecardId: '',
    departmentId: userDepartmentId || '',
    file: null,
  })

  const load = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [apiBase])

  useEffect(() => {
    if (!selectedCallId) {
      setSelectedCall(null)
      return
    }

    api(`${apiBase}/calls/${selectedCallId}`)
      .then((data) => setSelectedCall(data.call))
      .catch((err) => setError(err.message))
  }, [apiBase, selectedCallId])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) {
      setError('Choose an audio file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('audio', uploadForm.file)
      if (uploadForm.scorecardId) formData.append('scorecardId', uploadForm.scorecardId)
      if (uploadForm.departmentId) formData.append('departmentId', uploadForm.departmentId)

      await uploadFile(`${apiBase}/calls`, formData)
      setUploadForm({ scorecardId: '', departmentId: userDepartmentId || '', file: null })
      e.target.reset()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      <form onSubmit={handleUpload} className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Upload call</h3>
        <p className="text-sm text-slate-500">
          MP3, WAV, M4A, OGG, or WEBM — stored on this server. Scoring runs in a later phase.
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
            required
            onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
            className="sm:col-span-2 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-numa-50 file:text-numa-700 file:font-semibold"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="px-5 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload call'}
        </button>
      </form>

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

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Uploaded by</dt>
                  <dd className="font-medium text-slate-900">{selectedCall.uploadedBy.email}</dd>
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

              {selectedCall.scorecard?.criteria?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Scorecard criteria</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {selectedCall.scorecard.criteria.map((c) => (
                      <li key={c.id}>• {c.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <audio controls className="w-full" src={audioSrc}>
                Your browser does not support audio playback.
              </audio>

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
          )}
        </section>
      </div>
    </div>
  )
}
