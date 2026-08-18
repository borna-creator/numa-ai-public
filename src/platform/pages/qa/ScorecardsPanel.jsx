import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import {
  CRITERION_QUESTION_TYPES,
  DEFAULT_CRITERION_QUESTION_TYPE,
  getCriterionQuestionTypeLabel,
} from '../../../../shared/criterionQuestionTypes.js'

const emptyCriterion = () => ({
  label: '',
  description: '',
  weight: 1,
  questionType: DEFAULT_CRITERION_QUESTION_TYPE,
})

export default function ScorecardsPanel({ apiBase, canManage = false }) {
  const [scorecards, setScorecards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    criteria: [emptyCriterion()],
  })

  const load = async () => {
    try {
      setLoading(true)
      const data = await api(`${apiBase}/scorecards`)
      setScorecards(data.scorecards)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [apiBase])

  const resetForm = () => {
    setForm({ name: '', description: '', isActive: true, criteria: [emptyCriterion()] })
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (scorecard) => {
    setEditingId(scorecard.id)
    setShowForm(true)
    setForm({
      name: scorecard.name,
      description: scorecard.description || '',
      isActive: scorecard.isActive,
      criteria: scorecard.criteria.map((c) => ({
        label: c.label,
        description: c.description || '',
        weight: c.weight,
        questionType: c.questionType || DEFAULT_CRITERION_QUESTION_TYPE,
      })),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        isActive: form.isActive,
        criteria: form.criteria.filter((c) => c.label.trim()),
      }

      if (editingId) {
        await api(`${apiBase}/scorecards/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await api(`${apiBase}/scorecards`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (scorecard) => {
    if (!window.confirm(`Delete scorecard "${scorecard.name}"?`)) return
    setError('')
    try {
      await api(`${apiBase}/scorecards/${scorecard.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateCriterion = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }))
  }

  if (loading) {
    return <p className="text-slate-500 text-sm">Loading scorecards…</p>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>
      )}

      {canManage && (
        <div className="flex justify-between items-center gap-4">
          <p className="text-sm text-slate-600">
            Define the criteria calls will be scored against.
          </p>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-numa-600 hover:bg-numa-700 shrink-0"
            >
              + New scorecard
            </button>
          )}
        </div>
      )}

      {canManage && showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingId ? 'Edit scorecard' : 'New scorecard'}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              placeholder="Scorecard name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700 px-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active for new uploads
            </label>
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-numa-500/30 min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">Criteria</p>
              <button
                type="button"
                onClick={() => setForm({ ...form, criteria: [...form.criteria, emptyCriterion()] })}
                className="text-sm text-numa-600 hover:underline"
              >
                + Add criterion
              </button>
            </div>
            {form.criteria.map((criterion, index) => (
              <div key={index} className="grid sm:grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  placeholder="Criterion label"
                  required
                  value={criterion.label}
                  onChange={(e) => updateCriterion(index, 'label', e.target.value)}
                  className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
                <select
                  value={criterion.questionType}
                  onChange={(e) => updateCriterion(index, 'questionType', e.target.value)}
                  className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  title="Question type"
                >
                  {CRITERION_QUESTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Description / guidance"
                  value={criterion.description}
                  onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                  className="sm:col-span-4 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  value={criterion.weight}
                  onChange={(e) => updateCriterion(index, 'weight', Number(e.target.value))}
                  className="sm:col-span-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  title="Weight"
                />
                {form.criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        criteria: form.criteria.filter((_, i) => i !== index),
                      })
                    }
                    className="sm:col-span-1 text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white bg-numa-600 hover:bg-numa-700">
              {editingId ? 'Save changes' : 'Create scorecard'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {scorecards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">No scorecards yet.</p>
          {canManage && (
            <p className="text-sm text-slate-500 mt-1">Create one before uploading calls for scoring.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {scorecards.map((scorecard) => (
            <div key={scorecard.id} className="rounded-2xl border border-slate-200/80 bg-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{scorecard.name}</h3>
                    {!scorecard.isActive && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  {scorecard.description && (
                    <p className="text-sm text-slate-500 mt-1">{scorecard.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {scorecard.criteria.length} criteria · {scorecard._count.calls} calls
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(scorecard)}
                      className="text-sm text-numa-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(scorecard)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {scorecard.criteria.map((criterion) => (
                  <li key={criterion.id} className="px-4 py-3 text-sm">
                    <span className="font-medium text-slate-900">{criterion.label}</span>
                    <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-numa-50 text-numa-700">
                      {getCriterionQuestionTypeLabel(criterion.questionType)}
                    </span>
                    {criterion.description && (
                      <span className="text-slate-500 ml-2">— {criterion.description}</span>
                    )}
                    <span className="text-slate-400 ml-2">(weight {criterion.weight})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
