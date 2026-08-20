import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import {
  CRITERION_QUESTION_TYPES,
  DEFAULT_CRITERION_QUESTION_TYPE,
  getCriterionQuestionTypeLabel,
} from '../../../../shared/criterionQuestionTypes.js'
import {
  DEFAULT_SCORECARD_LANGUAGE,
  SCORECARD_LANGUAGES,
  getScorecardLanguageLabel,
} from '../../../../shared/scorecardLanguages.js'
import {
  DEFAULT_STT_SETTINGS,
  STT_SETTINGS_META,
  isSummarizationSupported,
  normalizeSttSettings,
} from '../../../../shared/sttSettings.js'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconClipboard,
  Input,
  LoadingState,
  PageIntro,
  Select,
  Textarea,
} from '../../components/ui.jsx'

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
    language: DEFAULT_SCORECARD_LANGUAGE,
    isActive: true,
    sttSettings: { ...DEFAULT_STT_SETTINGS },
    criteria: [emptyCriterion()],
  })
  const [showSttSettings, setShowSttSettings] = useState(false)

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
    setForm({
      name: '',
      description: '',
      language: DEFAULT_SCORECARD_LANGUAGE,
      isActive: true,
      sttSettings: { ...DEFAULT_STT_SETTINGS },
      criteria: [emptyCriterion()],
    })
    setEditingId(null)
    setShowForm(false)
    setShowSttSettings(false)
  }

  const startEdit = (scorecard) => {
    setEditingId(scorecard.id)
    setShowForm(true)
    setForm({
      name: scorecard.name,
      description: scorecard.description || '',
      language: scorecard.language || DEFAULT_SCORECARD_LANGUAGE,
      isActive: scorecard.isActive,
      sttSettings: normalizeSttSettings(scorecard.sttSettings, scorecard.language),
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
        language: form.language,
        isActive: form.isActive,
        sttSettings: normalizeSttSettings(form.sttSettings, form.language),
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

  const updateSttSetting = (key, value) => {
    if (key === 'summarize' && !isSummarizationSupported(form.language)) return
    setForm((prev) => ({
      ...prev,
      sttSettings: { ...prev.sttSettings, [key]: value },
    }))
  }

  const handleLanguageChange = (language) => {
    setForm((prev) => ({
      ...prev,
      language,
      sttSettings: normalizeSttSettings(prev.sttSettings, language),
    }))
  }

  if (loading) {
    return <LoadingState label="Loading scorecards…" />
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {canManage && (
        <PageIntro
          title="Scorecards"
          description="Define the criteria and transcription settings used when calls are scored."
          action={
            !showForm && (
              <Button onClick={() => setShowForm(true)}>+ New scorecard</Button>
            )
          }
        />
      )}

      {canManage && showForm && (
        <Card>
          <CardHeader
            title={editingId ? 'Edit scorecard' : 'New scorecard'}
            description="Configure language, criteria, and transcription behavior for this scorecard."
          />
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="e.g. Inbound sales QA"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Select
                label="Language"
                value={form.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                {SCORECARD_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </Select>
              <Textarea
                label="Description"
                placeholder="Optional notes for your team"
                className="sm:col-span-2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <label className="sm:col-span-2 flex items-center gap-2.5 text-sm text-slate-700 px-1">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-numa-600 focus:ring-numa-500/30"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active for new uploads
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSttSettings((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50/80 text-sm font-semibold text-slate-900 hover:bg-slate-100/80 transition-colors"
              >
                Transcription options
                <span className="text-xs font-medium text-slate-500">{showSttSettings ? 'Hide' : 'Show'}</span>
              </button>
              {showSttSettings && (
                <div className="p-4 grid sm:grid-cols-2 gap-2 border-t border-slate-200 bg-white">
                  {STT_SETTINGS_META.map(({ key, label, description, englishOnly }) => {
                    const disabled = englishOnly && !isSummarizationSupported(form.language)
                    return (
                    <label
                      key={key}
                      className={`flex items-start gap-2.5 text-sm p-3 rounded-xl border border-transparent ${
                        disabled
                          ? 'text-slate-400 cursor-not-allowed opacity-60'
                          : 'text-slate-700 hover:bg-slate-50 hover:border-slate-100'
                      }`}
                      title={description}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300 text-numa-600"
                        checked={Boolean(form.sttSettings[key])}
                        disabled={disabled}
                        onChange={(e) => updateSttSetting(key, e.target.checked)}
                      />
                      <span>
                        <span className="font-medium text-slate-900">{label}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {description}
                          {disabled && ' Not available for this language.'}
                        </span>
                      </span>
                    </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Criteria</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm({ ...form, criteria: [...form.criteria, emptyCriterion()] })}
                >
                  + Add criterion
                </Button>
              </div>
              {form.criteria.map((criterion, index) => (
                <div key={index} className="grid sm:grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <input
                    placeholder="Criterion label"
                    required
                    value={criterion.label}
                    onChange={(e) => updateCriterion(index, 'label', e.target.value)}
                    className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  />
                  <select
                    value={criterion.questionType}
                    onChange={(e) => updateCriterion(index, 'questionType', e.target.value)}
                    className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    {CRITERION_QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Guidance (optional)"
                    value={criterion.description}
                    onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                    className="sm:col-span-4 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  />
                  <input
                    type="number"
                    min={1}
                    value={criterion.weight}
                    onChange={(e) => updateCriterion(index, 'weight', Number(e.target.value))}
                    className="sm:col-span-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    title="Weight"
                  />
                  {form.criteria.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="sm:col-span-1 text-red-600"
                      onClick={() =>
                        setForm({ ...form, criteria: form.criteria.filter((_, i) => i !== index) })
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit">{editingId ? 'Save changes' : 'Create scorecard'}</Button>
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {scorecards.length === 0 ? (
        <Card>
          <EmptyState
            icon={IconClipboard}
            title="No scorecards yet"
            description={canManage ? 'Create a scorecard before uploading calls for scoring.' : 'Your admin has not created scorecards yet.'}
            action={canManage && !showForm && <Button onClick={() => setShowForm(true)}>+ New scorecard</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {scorecards.map((scorecard) => (
            <Card key={scorecard.id} className="hover:shadow-md hover:shadow-slate-900/5 transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{scorecard.name}</h3>
                    {!scorecard.isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  {scorecard.description && (
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{scorecard.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {getScorecardLanguageLabel(scorecard.language)}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-numa-50 text-numa-700">
                      {scorecard.criteria.length} criteria
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {scorecard._count.calls} calls
                    </span>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(scorecard)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(scorecard)}>Delete</Button>
                  </div>
                )}
              </div>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {scorecard.criteria.map((criterion) => (
                  <li key={criterion.id} className="px-4 py-3.5 text-sm bg-white even:bg-slate-50/40">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{criterion.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-numa-50 text-numa-700">
                        {getCriterionQuestionTypeLabel(criterion.questionType)}
                      </span>
                      <span className="text-xs text-slate-400">Weight {criterion.weight}</span>
                    </div>
                    {criterion.description && (
                      <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{criterion.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
