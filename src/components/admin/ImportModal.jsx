import { useState, useRef, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import {
  X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle,
  Loader2, ArrowRight, ChevronDown, ChevronUp, Check, Copy,
} from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/* ─── Fuzzy aliases for smart auto-mapping ─── */
const FIELD_ALIASES = {
  question_en: ['question', 'q', 'question_en', 'question en', 'question_text', 'q_en', 'english question', 'text'],
  question_fr: ['question_fr', 'question fr', 'q_fr', 'french question'],
  question_it: ['question_it', 'question it', 'q_it', 'italian question'],
  question_es: ['question_es', 'question es', 'q_es', 'spanish question'],
  answers_en: ['answers', 'answers_en', 'answers en', 'options', 'options_en', 'choices', 'answer options'],
  answers_fr: ['answers_fr', 'answers fr', 'options_fr'],
  answers_it: ['answers_it', 'answers it', 'options_it'],
  answers_es: ['answers_es', 'answers es', 'options_es'],
  explanation_en: ['explanation', 'explanation_en', 'explanation en', 'explain', 'rationale', 'reason'],
  explanation_fr: ['explanation_fr', 'explanation fr'],
  explanation_it: ['explanation_it', 'explanation it'],
  explanation_es: ['explanation_es', 'explanation es'],
  correct_answer_index: ['correct', 'correct_answer', 'correct_answer_index', 'answer', 'correct answer', 'answer_index', 'correct_index', 'right answer'],
  macro_category: ['category', 'macro_category', 'macro category', 'cat', 'topic_category'],
  sub_category: ['sub_category', 'sub category', 'subcategory'],
  topic: ['topic', 'subject', 'theme'],
  difficulty: ['difficulty', 'diff', 'level', 'difficulty_level'],
}

/* Also detect individual answer columns: answer_1/A/option_a etc. */
const ANSWER_COL_PATTERNS = [
  /^answer[\s_]?([a-d1-4])$/i,
  /^option[\s_]?([a-d1-4])$/i,
  /^choice[\s_]?([a-d1-4])$/i,
  /^([a-d])$/i,
  /^a([1-4])$/i,
]

const REQUIRED_FIELDS = ['question_en', 'answers_en', 'correct_answer_index', 'macro_category']
const ALL_FIELDS = Object.keys(FIELD_ALIASES)

const DIFF_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
}

/**
 * ImportModal — FIX 9: complete refonte with smart fuzzy auto-mapping,
 * beautiful preview showing answers with correct in green ✓,
 * explanation, category/difficulty badges, checkboxes, duplicate badges.
 */
export default function ImportModal({ onClose, onImported }) {
  const [step, setStep] = useState('upload') // upload | map | preview | importing | done
  const [fileName, setFileName] = useState('')
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [answerCols, setAnswerCols] = useState([]) // individual answer columns [colA, colB, colC, colD]
  const [preview, setPreview] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [duplicates, setDuplicates] = useState({})
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [checkingDupes, setCheckingDupes] = useState(false)
  const fileRef = useRef(null)

  // ── Smart fuzzy matching ──
  function fuzzyMatch(header) {
    const clean = header.toLowerCase().replace(/[\s_\-'"]/g, '').trim()
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[\s_\-'"]/g, '')
        if (clean === cleanAlias) return { field, confidence: 1.0 }
        // Partial match
        if (clean.includes(cleanAlias) || cleanAlias.includes(clean)) {
          return { field, confidence: 0.7 }
        }
      }
    }
    return null
  }

  // Check if individual answer columns exist (answer_1, answer_2, answer_3, answer_4)
  function detectAnswerColumns(hdrs) {
    const found = [null, null, null, null] // slots for answers 1-4
    for (const h of hdrs) {
      for (const pattern of ANSWER_COL_PATTERNS) {
        const m = h.match(pattern)
        if (m) {
          let idx = m[1].toLowerCase()
          if ('abcd'.includes(idx)) idx = 'abcd'.indexOf(idx) + 1
          else idx = parseInt(idx, 10)
          if (idx >= 1 && idx <= 4) found[idx - 1] = h
        }
      }
    }
    return found.every(Boolean) ? found : []
  }

  // ── Parse file ──
  function handleFile(file) {
    setError(null)
    setFileName(file.name)
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'csv' || ext === 'tsv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`Parse error: ${results.errors[0].message}`)
            return
          }
          processData(results.meta.fields, results.data)
        },
        error: (err) => setError('Failed to parse CSV: ' + err.message),
      })
    } else if (['xlsx', 'xls'].includes(ext)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const json = XLSX.utils.sheet_to_json(ws, { header: 1 })
          if (json.length < 2) { setError('File has no data rows'); return }
          const hdrs = json[0].map(String)
          const rows = json.slice(1).filter(r => r.some(c => c != null && c !== '')).map((row) => {
            const obj = {}
            hdrs.forEach((h, i) => { obj[h] = row[i] ?? '' })
            return obj
          })
          processData(hdrs, rows)
        } catch (err) {
          setError('Failed to parse file: ' + err.message)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setError('Unsupported file type. Please use .csv, .xlsx, or .xls')
    }
  }

  function processData(hdrs, data) {
    setHeaders(hdrs)
    setRawData(data)

    // Smart auto-mapping
    const autoMap = {}
    const usedHeaders = new Set()
    // First pass: exact & high-confidence matches
    for (const h of hdrs) {
      const match = fuzzyMatch(h)
      if (match && match.confidence >= 0.7 && !usedHeaders.has(h)) {
        if (!autoMap[match.field]) {
          autoMap[match.field] = h
          usedHeaders.add(h)
        }
      }
    }

    // Detect individual answer columns
    const aCols = detectAnswerColumns(hdrs)
    setAnswerCols(aCols)

    // If we found answer columns but no answers_en mapping, we'll merge them later
    if (aCols.length === 4 && !autoMap.answers_en) {
      autoMap._answerCols = true // marker
    }

    setMapping(autoMap)

    // If all required fields are mapped (or answer cols detected), skip to preview
    const requiredMapped = REQUIRED_FIELDS.every(f =>
      f === 'answers_en' ? (autoMap.answers_en || aCols.length === 4) : autoMap[f]
    )
    if (requiredMapped) {
      // Auto-skip mapping step → go straight to preview building
      buildPreview(autoMap, aCols, data, hdrs)
    } else {
      setStep('map')
    }
  }

  function updateMapping(targetField, sourceColumn) {
    setMapping((prev) => {
      const next = { ...prev }
      if (sourceColumn === '') delete next[targetField]
      else next[targetField] = sourceColumn
      return next
    })
  }

  // ── Build preview & check duplicates ──
  async function buildPreview(map = mapping, aCols = answerCols, data = rawData, hdrs = headers) {
    setError(null)
    setCheckingDupes(true)

    // Validate required
    const useAnswerCols = aCols.length === 4 && !map.answers_en
    const missing = REQUIRED_FIELDS.filter(f => {
      if (f === 'answers_en') return !map[f] && !useAnswerCols
      return !map[f]
    })
    if (missing.length > 0) {
      setError(`Required fields not mapped: ${missing.join(', ')}`)
      setCheckingDupes(false)
      return
    }

    // Build rows
    const rows = data.map((row) => {
      const q = {}
      for (const [target, source] of Object.entries(map)) {
        if (target === '_answerCols') continue
        let val = row[source]
        if (target.startsWith('answers_') && typeof val === 'string') {
          try { val = JSON.parse(val) } catch {
            val = val.split(/[;|]/).map(s => s.trim()).filter(Boolean)
            if (val.length === 1) val = val[0].split(',').map(s => s.trim())
          }
          if (!Array.isArray(val) || val.length < 4) val = null
        }
        if (target === 'correct_answer_index') {
          val = parseInt(val, 10)
          if (isNaN(val) || val < 1 || val > 4) val = 1
        }
        q[target] = val
      }
      // Merge individual answer columns
      if (useAnswerCols) {
        q.answers_en = aCols.map(col => String(row[col] || '').trim())
        if (q.answers_en.some(a => !a)) q.answers_en = null
      }
      // Defaults
      if (!q.difficulty) q.difficulty = 'medium'
      if (!q.macro_category || !CATEGORIES.includes(q.macro_category)) {
        q.macro_category = CATEGORIES[0]
      }
      return q
    }).filter(q => q.question_en && q.answers_en)

    setPreview(rows)
    // Select all by default
    setSelected(new Set(rows.map((_, i) => i)))

    // Parallel duplicate detection
    const dupeMap = {}
    const checks = rows.map((q, i) => {
      const prefix = (q.question_en || '').slice(0, 50).toLowerCase()
      if (!prefix) return Promise.resolve()
      return supabase
        .from('questions')
        .select('id, question_en')
        .ilike('question_en', `${prefix}%`)
        .limit(1)
        .then(({ data: d }) => {
          if (d && d.length > 0) dupeMap[i] = d[0]
        })
    })
    await Promise.all(checks)
    setDuplicates(dupeMap)

    // Deselect duplicates by default
    const sel = new Set(rows.map((_, i) => i))
    Object.keys(dupeMap).forEach(k => sel.delete(Number(k)))
    setSelected(sel)

    setCheckingDupes(false)
    setStep('preview')
  }

  // ── Import selected rows ──
  async function handleImport() {
    setImporting(true)
    setError(null)
    setImportProgress(0)
    let imported = 0
    let skipped = 0
    let duplicated = 0

    const toImport = [...selected].sort((a, b) => a - b)
    const total = toImport.length

    // Batch insert in chunks of 50
    const batchSize = 50
    for (let b = 0; b < toImport.length; b += batchSize) {
      const batch = toImport.slice(b, b + batchSize)
      const payloads = batch.map(i => {
        const q = preview[i]
        return {
          question_en: q.question_en,
          question_fr: q.question_fr || null,
          question_it: q.question_it || null,
          question_es: q.question_es || null,
          answers_en: q.answers_en,
          answers_fr: q.answers_fr || null,
          answers_it: q.answers_it || null,
          answers_es: q.answers_es || null,
          explanation_en: q.explanation_en || '',
          explanation_fr: q.explanation_fr || null,
          explanation_it: q.explanation_it || null,
          explanation_es: q.explanation_es || null,
          correct_answer_index: q.correct_answer_index || 1,
          macro_category: q.macro_category,
          sub_category: q.sub_category || null,
          topic: q.topic || null,
          difficulty: q.difficulty || 'medium',
          status: 'pending_review',
          source: 'import',
        }
      })

      const { error: bErr, data: bData } = await supabase.from('questions').insert(payloads).select('id')
      if (bErr) {
        skipped += batch.length
      } else {
        imported += (bData?.length || batch.length)
      }
      setImportProgress(Math.round(((b + batch.length) / total) * 100))
    }

    duplicated = preview.length - total
    setResult({ imported, skipped, duplicated })
    setStep('done')
    setImporting(false)
    onImported?.()
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  function toggleSelect(idx) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === preview.length) setSelected(new Set())
    else setSelected(new Set(preview.map((_, i) => i)))
  }

  // ── Computed stats ──
  const stats = useMemo(() => {
    const dupeCount = Object.keys(duplicates).length
    return {
      total: preview.length,
      selected: selected.size,
      duplicates: dupeCount,
      ready: selected.size,
    }
  }, [preview, selected, duplicates])

  // ── Mapping quality score ──
  const mappedRequired = REQUIRED_FIELDS.filter(f =>
    f === 'answers_en' ? (mapping[f] || answerCols.length === 4) : mapping[f]
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              {step === 'upload' && '📤 Import Questions'}
              {step === 'map' && '🔗 Map Columns'}
              {step === 'preview' && '👀 Preview & Import'}
              {step === 'importing' && '⏳ Importing...'}
              {step === 'done' && '✅ Import Complete'}
            </h2>
            {/* Step indicator */}
            {step !== 'done' && step !== 'importing' && (
              <div className="flex items-center gap-1 ml-2">
                {['upload', 'map', 'preview'].map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      s === step ? 'bg-[#1B3D2F]' :
                      ['upload', 'map', 'preview'].indexOf(s) < ['upload', 'map', 'preview'].indexOf(step)
                        ? 'bg-[#2ECC71]' : 'bg-gray-300'
                    }`} />
                    {i < 2 && <div className="w-4 h-px bg-gray-300" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1A1A1A] p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ── STEP 1: Upload ── */}
          {step === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl py-16 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#2ECC71] bg-emerald-50 scale-[1.01]'
                  : 'border-[#D1D5DB] hover:border-[#2ECC71] hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet size={48} className="mx-auto text-[#6B7280] mb-4" />
              <p className="text-base font-semibold text-[#1A1A1A] mb-1">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-[#6B7280] mb-4">
                Supports .csv, .xlsx, .xls
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg">
                <Upload size={14} />
                Choose File
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.tsv"
                onChange={(e) => { const f = e.target?.files?.[0]; if (f) handleFile(f) }}
                className="hidden"
              />
            </div>
          )}

          {/* ── STEP 2: Column Mapping ── */}
          {step === 'map' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#6B7280]">
                  📄 <span className="font-medium text-[#1A1A1A]">{fileName}</span> — {rawData.length} rows found
                </p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  mappedRequired === REQUIRED_FIELDS.length
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {mappedRequired}/{REQUIRED_FIELDS.length} required mapped
                </span>
              </div>

              {answerCols.length === 4 && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  ✨ Detected individual answer columns: {answerCols.join(', ')} — these will be merged automatically
                </div>
              )}

              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                {ALL_FIELDS.map((field) => {
                  const isRequired = REQUIRED_FIELDS.includes(field)
                  const isMapped = !!mapping[field]
                  const isAnswerColsDetected = field === 'answers_en' && answerCols.length === 4
                  return (
                    <div
                      key={field}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                        isMapped || isAnswerColsDetected ? 'bg-green-50' : isRequired ? 'bg-red-50' : ''
                      }`}
                    >
                      <div className="w-44 shrink-0">
                        <span className={`text-sm ${isRequired ? 'font-semibold text-[#1A1A1A]' : 'text-[#6B7280]'}`}>
                          {field}
                        </span>
                        {isRequired && <span className="text-red-500 ml-1 text-xs">*</span>}
                      </div>
                      <ArrowRight size={14} className="text-gray-400 shrink-0" />
                      {isAnswerColsDetected && !mapping[field] ? (
                        <div className="flex-1 text-sm text-blue-600 font-medium">
                          ← auto-merged from {answerCols.join(' + ')}
                        </div>
                      ) : (
                        <select
                          value={mapping[field] || ''}
                          onChange={(e) => updateMapping(field, e.target.value)}
                          className="flex-1 border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] bg-white"
                        >
                          <option value="">— Skip —</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      )}
                      {(isMapped || isAnswerColsDetected) && (
                        <CheckCircle size={16} className="text-[#2ECC71] shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between mt-5">
                <button
                  onClick={() => { setStep('upload'); setRawData([]); setHeaders([]) }}
                  className="px-4 py-2.5 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => buildPreview()}
                  disabled={checkingDupes}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {checkingDupes ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  {checkingDupes ? 'Checking duplicates...' : 'Preview'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Preview ── */}
          {step === 'preview' && (
            <div>
              {/* Stats bar */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm text-[#6B7280]">
                  📄 <span className="font-medium text-[#1A1A1A]">{fileName}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {stats.total} questions
                </span>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                  {stats.selected} selected
                </span>
                {stats.duplicates > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    ⚠️ {stats.duplicates} duplicates
                  </span>
                )}
              </div>

              {/* Select all toggle */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1A1A1A]">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    selected.size === preview.length ? 'bg-[#1B3D2F] border-[#1B3D2F]' : 'border-gray-300'
                  }`}>
                    {selected.size === preview.length && <Check size={10} className="text-white" />}
                  </div>
                  {selected.size === preview.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Question cards */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {preview.map((q, idx) => {
                  const isDupe = !!duplicates[idx]
                  const isSelected = selected.has(idx)
                  const isExpanded = expandedRow === idx
                  const correctIdx = (q.correct_answer_index || 1) - 1

                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl transition-all ${
                        isDupe ? 'border-amber-200 bg-amber-50/50' :
                        isSelected ? 'border-[#2ECC71]/30 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      {/* Row header */}
                      <div className="flex items-start gap-3 px-4 py-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(idx)}
                          className="mt-0.5 shrink-0"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#1B3D2F] border-[#1B3D2F]' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                        </button>

                        {/* Question text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-mono text-[#6B7280] mt-0.5 shrink-0">#{idx + 1}</span>
                            <p className="text-sm text-[#1A1A1A] leading-snug">
                              {q.question_en}
                            </p>
                          </div>
                          {/* Badges */}
                          <div className="flex items-center gap-1.5 mt-1.5 ml-6">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[#6B7280] text-[10px] font-medium truncate max-w-[140px]">
                              {q.macro_category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${DIFF_COLORS[q.difficulty] || DIFF_COLORS.medium}`}>
                              {q.difficulty}
                            </span>
                            {isDupe && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold flex items-center gap-0.5">
                                <Copy size={8} /> Duplicate
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand toggle */}
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : idx)}
                          className="text-[#6B7280] hover:text-[#1A1A1A] p-1 shrink-0"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 ml-7 border-t border-gray-100 mt-1">
                          {/* Answers */}
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1.5">Answers</p>
                          <div className="grid grid-cols-2 gap-1.5 mb-3">
                            {(q.answers_en || []).map((ans, ai) => (
                              <div
                                key={ai}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                  ai === correctIdx
                                    ? 'bg-green-50 border border-green-200 text-green-800 font-medium'
                                    : 'bg-gray-50 border border-gray-100 text-[#1A1A1A]'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  ai === correctIdx ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {'ABCD'[ai]}
                                </span>
                                <span className="truncate">{ans}</span>
                                {ai === correctIdx && <Check size={12} className="text-green-600 shrink-0 ml-auto" />}
                              </div>
                            ))}
                          </div>

                          {/* Explanation */}
                          {q.explanation_en && (
                            <div className="mb-2">
                              <p className="text-[10px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1">Explanation</p>
                              <p className="text-xs text-[#6B7280] leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
                                {q.explanation_en}
                              </p>
                            </div>
                          )}

                          {/* Duplicate warning */}
                          {isDupe && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                              ⚠️ Similar question exists in DB: "{duplicates[idx]?.question_en?.slice(0, 80)}..."
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep('map')}
                  className="px-4 py-2.5 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Edit Mapping
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || selected.size === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Import {selected.size} Question{selected.size !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3.5: Importing progress ── */}
          {step === 'importing' && (
            <div className="text-center py-12">
              <Loader2 size={40} className="mx-auto text-[#1B3D2F] animate-spin mb-4" />
              <p className="text-base font-semibold text-[#1A1A1A] mb-2">Importing questions...</p>
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full bg-[#2ECC71] transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-[#6B7280]">{importProgress}%</p>
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 'done' && result && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[#2ECC71]" />
              </div>
              <p className="text-xl font-bold text-[#1A1A1A] mb-1">Import Complete!</p>
              <p className="text-sm text-[#6B7280] mb-6">Your questions have been added to the database</p>

              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#2ECC71]">{result.imported}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Imported</p>
                </div>
                {result.duplicated > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-500">{result.duplicated}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Skipped (dupes)</p>
                  </div>
                )}
                {result.skipped > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">{result.skipped}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">Errors</p>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
