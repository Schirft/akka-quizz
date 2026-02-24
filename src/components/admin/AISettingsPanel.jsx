import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AI_SYSTEM_PROMPT, PACK_DEFAULT_PROMPT } from '../../config/aiPrompts'
import { X, Save, RotateCcw, Loader2 } from 'lucide-react'

/**
 * AISettingsPanel — modal to edit AI prompts with separate tabs.
 * Saves to app_settings table. Round 15: separate Pack + Questions prompts.
 */
export default function AISettingsPanel({ onClose, currentPrompt, onPromptChanged }) {
  const [activeTab, setActiveTab] = useState('questions')
  const [questionsPrompt, setQuestionsPrompt] = useState(currentPrompt || '')
  const [packPrompt, setPackPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // Load pack prompt on mount
  useEffect(() => {
    async function loadPackPrompt() {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'pack_system_prompt')
          .single()
        if (data?.value) setPackPrompt(data.value)
      } catch {}
    }
    loadPackPrompt()
  }, [])

  const currentText = activeTab === 'questions' ? questionsPrompt : packPrompt
  const setCurrentText = activeTab === 'questions' ? setQuestionsPrompt : setPackPrompt
  const isCustom = currentText.trim() !== '' && currentText.trim() !== AI_SYSTEM_PROMPT.trim()

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      if (activeTab === 'questions') {
        const trimmed = questionsPrompt.trim()
        if (!trimmed || trimmed === AI_SYSTEM_PROMPT.trim()) {
          await supabase.from('app_settings').delete().eq('key', 'custom_system_prompt')
          onPromptChanged?.(null)
        } else {
          const { error: err } = await supabase
            .from('app_settings')
            .upsert({
              key: 'custom_system_prompt',
              value: trimmed,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' })
          if (err) throw err
          onPromptChanged?.(trimmed)
        }
      } else {
        const trimmed = packPrompt.trim()
        if (!trimmed) {
          await supabase.from('app_settings').delete().eq('key', 'pack_system_prompt')
        } else {
          const { error: err } = await supabase
            .from('app_settings')
            .upsert({
              key: 'pack_system_prompt',
              value: trimmed,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' })
          if (err) throw err
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setCurrentText('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1A1A1A]">AI Settings</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isCustom ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>
              {isCustom ? 'Custom Prompt' : 'Default Prompt'}
            </span>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1A1A1A] p-1">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D1D5DB]">
          {[
            { key: 'questions', label: 'Questions Prompt' },
            { key: 'pack', label: 'Pack Prompt' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-[#1B3D2F] border-b-2 border-[#2ECC71]'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          {saved && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
              Settings saved successfully
            </div>
          )}

          <label className="block mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            {activeTab === 'questions' ? 'Custom Questions System Prompt' : 'Custom Pack System Prompt'}
          </label>
          <p className="text-xs text-[#6B7280] mb-2">
            {activeTab === 'questions'
              ? 'Override the default prompt used when generating classic QCM questions. Leave empty to use the default.'
              : 'Override the default prompt used by the Edge Function for daily pack generation. Leave empty to use the default.'
            }
          </p>
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            rows={10}
            className="w-full border border-[#D1D5DB] rounded-xl px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2ECC71] mb-2 resize-y"
            placeholder={`Enter your custom ${activeTab === 'questions' ? 'questions' : 'pack'} prompt here...`}
          />
          <p className="text-xs text-[#6B7280] mb-4">
            {currentText.length} characters
          </p>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors mb-6"
          >
            <RotateCcw size={14} />
            Reset to Default
          </button>

          {activeTab === 'questions' && (
            <div className="border-t border-[#D1D5DB] pt-4">
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Default System Prompt (read-only)
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono text-[#6B7280] max-h-[200px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {AI_SYSTEM_PROMPT}
              </div>
            </div>
          )}
          {activeTab === 'pack' && (
            <div className="border-t border-[#D1D5DB] pt-4">
              <label className="block mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Default Pack Prompt (read-only)
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono text-[#6B7280] max-h-[200px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {PACK_DEFAULT_PROMPT}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#D1D5DB] gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
