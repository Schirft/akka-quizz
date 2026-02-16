import { useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const REQUIRED_FIELDS = ['question_en', 'answers_en', 'correct_answer_index', 'macro_category']
const ALL_FIELDS = [
  'question_en', 'question_fr', 'question_it', 'question_es',
  'answers_en', 'answers_fr', 'answers_it', 'answers_es',
  'explanation_en', 'explanation_fr', 'explanation_it', 'explanation_es',
  'correct_answer_index', 'macro_category', 'sub_category', 'topic', 'difficulty',
]

/**
 * ImportModal — drag & drop CSV/Excel import with column mapping and duplicate detection.
 */
export default function ImportModal({ onClose, onImported }) {
  const [step, setStep] = useState('upload') // upload | map | preview | importing | done
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({}) // { targetField: sourceColumnHeader }
  const [preview, setPreview] = useState([])
  const [duplicates, setDuplicates] = useState({}) // { rowIndex: existingQuestion }
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null) // { imported, skipped, duplicated }
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  // Parse file (CSV or Excel)
  function handleFile(file) {
    setError(null)
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
          if (json.length < 2) {
            setError('Excel file has no data rows')
            return
          }
          const hdrs = json[0].map(String)
          const rows = json.slice(1).map((row) => {
            const obj = {}
            hdrs.forEach((h, i) => { obj[h] = row[i] ?? '' })
            return obj
          })
          processData(hdrs, rows)
        } catch (err) {
          setError('Failed to parse Excel: ' + err.message)
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

    // Auto-map columns by matching names
    const autoMap = {}
    for (const field of ALL_FIELDS) {
      const match = hdrs.find((h) =>
        h.toLowerCase().replace(/[\s_-]/g, '') === field.toLowerCase().replace(/[\s_-]/g, '')
      )
      if (match) autoMap[field] = match
    }
    setMapping(autoMap)
    setStep('map')
  }

  function updateMapping(targetField, sourceColumn) {
    setMapping((prev) => {
      const next = { ...prev }
      if (sourceColumn === '') {
        delete next[targetField]
      } else {
        next[targetField] = sourceColumn
      }
      return next
    })
  }

  // Build preview & check duplicates
  async function handlePreview() {
    setError(null)

    // Validate required fields are mapped
    const missing = REQUIRED_FIELDS.filter((f) => !mapping[f])
    if (missing.length > 0) {
      setError(`Required fields not mapped: ${missing.join(', ')}`)
      return
    }

    // Build preview rows
    const rows = rawData.map((row) => {
      const q = {}
      for (const [target, source] of Object.entries(mapping)) {
        let val = row[source]
        // Parse answers JSON/array
        if (target.startsWith('answers_') && typeof val === 'string') {
          try {
            val = JSON.parse(val)
          } catch {
            // Try comma-separated
            val = val.split(/[;|]/).map((s) => s.trim()).filter(Boolean)
            if (val.length === 1) val = val[0].split(',').map((s) => s.trim())
          }
          if (!Array.isArray(val) || val.length < 4) val = null
        }
        if (target === 'correct_answer_index') {
          val = parseInt(val, 10)
          if (isNaN(val) || val < 1 || val > 4) val = 1
        }
        q[target] = val
      }
      // Defaults
      if (!q.difficulty) q.difficulty = 'medium'
      if (!q.macro_category || !CATEGORIES.includes(q.macro_category)) {
        q.macro_category = CATEGORIES[0]
      }
      return q
    }).filter((q) => q.question_en && q.answers_en)

    setPreview(rows)

    // Duplicate detection: check first 50 chars of question_en
    const dupeMap = {}
    for (let i = 0; i < rows.length; i++) {
      const prefix = (rows[i].question_en || '').slice(0, 50).toLowerCase()
      if (!prefix) continue

      const { data } = await supabase
        .from('questions')
        .select('id, question_en')
        .ilike('question_en', `${prefix}%`)
        .limit(1)

      if (data && data.length > 0) {
        dupeMap[i] = data[0]
      }
    }
    setDuplicates(dupeMap)
    setStep('preview')
  }

  // Import all (skip duplicates)
  async function handleImport() {
    setImporting(true)
    setError(null)
    let imported = 0
    let skipped = 0
    let duplicated = 0

    for (let i = 0; i < preview.length; i++) {
      if (duplicates[i]) {
        duplicated++
        continue
      }

      const q = preview[i]
      const payload = {
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

      const { error: iErr } = await supabase.from('questions').insert(payload)
      if (iErr) {
        skipped++
      } else {
        imported++
      }
    }

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

  function handleFileInput(e) {
    const file = e.target?.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {step === 'upload' && 'Import Questions'}
            {step === 'map' && 'Map Columns'}
            {step === 'preview' && 'Preview & Import'}
            {step === 'importing' && 'Importing...'}
            {step === 'done' && 'Import Complete'}
          </h2>
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

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl py-16 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-[#2ECC71] bg-emerald-50' : 'border-[#D1D5DB] hover:border-[#2ECC71]'
              }`}
            >
              <FileSpreadsheet size={40} className="mx-auto text-[#6B7280] mb-3" />
              <p className="text-sm font-medium text-[#1A1A1A] mb-1">
                Drop your CSV or Excel file here
              </p>
              <p className="text-xs text-[#6B7280]">
                Supports .csv, .xlsx, .xls
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.tsv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'map' && (
            <div>
              <p className="text-sm text-[#6B7280] mb-4">
                Found {rawData.length} rows. Map your columns to question fields:
              </p>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {ALL_FIELDS.map((field) => {
                  const isRequired = REQUIRED_FIELDS.includes(field)
                  return (
                    <div key={field} className="flex items-center gap-3">
                      <label className={`w-48 text-sm truncate ${isRequired ? 'font-semibold text-[#1A1A1A]' : 'text-[#6B7280]'}`}>
                        {field}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <select
                        value={mapping[field] || ''}
                        onChange={(e) => updateMapping(field, e.target.value)}
                        className="flex-1 border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                      >
                        <option value="">— Skip —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      {mapping[field] && (
                        <CheckCircle size={16} className="text-[#2ECC71] shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePreview}
                  className="px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && (
            <div>
              <p className="text-sm text-[#6B7280] mb-3">
                {preview.length} valid rows found.
                {Object.keys(duplicates).length > 0 && (
                  <span className="text-amber-600 font-medium ml-1">
                    ⚠️ {Object.keys(duplicates).length} possible duplicates (will be skipped)
                  </span>
                )}
              </p>
              <div className="overflow-x-auto max-h-[40vh] overflow-y-auto border border-[#D1D5DB] rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#D1D5DB]">
                      <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">#</th>
                      <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">Question</th>
                      <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">Category</th>
                      <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">Diff.</th>
                      <th className="py-2 px-3 text-left font-semibold text-[#6B7280]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((q, idx) => {
                      const isDupe = !!duplicates[idx]
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-gray-100 ${isDupe ? 'bg-amber-50' : ''}`}
                        >
                          <td className="py-2 px-3 text-[#6B7280]">{idx + 1}</td>
                          <td className="py-2 px-3 max-w-[300px]">
                            <p className="truncate text-[#1A1A1A]">{q.question_en?.slice(0, 60)}</p>
                            {isDupe && (
                              <span className="text-[10px] text-amber-600 font-medium">
                                ⚠️ Possible duplicate
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[#6B7280] truncate max-w-[120px]">{q.macro_category}</td>
                          <td className="py-2 px-3 capitalize">{q.difficulty}</td>
                          <td className="py-2 px-3">
                            {isDupe ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">skip</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">import</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {preview.length > 50 && (
                  <p className="text-xs text-[#6B7280] text-center py-2">
                    ...and {preview.length - 50} more rows
                  </p>
                )}
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => setStep('map')}
                  className="px-4 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Import {preview.length - Object.keys(duplicates).length} Questions
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && result && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto text-[#2ECC71] mb-4" />
              <p className="text-lg font-bold text-[#1A1A1A] mb-2">Import Complete!</p>
              <div className="flex justify-center gap-6 mb-6">
                <div>
                  <p className="text-2xl font-bold text-[#2ECC71]">{result.imported}</p>
                  <p className="text-xs text-[#6B7280]">Imported</p>
                </div>
                {result.duplicated > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-amber-500">{result.duplicated}</p>
                    <p className="text-xs text-[#6B7280]">Duplicates skipped</p>
                  </div>
                )}
                {result.skipped > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-red-500">{result.skipped}</p>
                    <p className="text-xs text-[#6B7280]">Errors</p>
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
