import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import {
  Loader2,
  Sparkles,
  Link as LinkIcon,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'

// Default prompts (from Edge Function)
const DEFAULT_SELECTION_PROMPT = `You are a startup/VC news curator. Analyze these articles and select the 5-10 most important ones for a startup ecosystem audience. Prioritize: funding rounds, major product launches, regulatory changes, and market-moving news. Return a JSON array of selected article URLs.`
const DEFAULT_SUMMARY_PROMPT = `You are a multilingual newsletter writer for a startup/VC audience. Given an article's full text, write a concise, insightful summary (3-5 paragraphs) that captures the key points, implications, and context. Write summaries in EN, FR, IT, and ES. Use a professional but engaging tone.`

export default function AdminNewsPage() {
  // Section A: Auto generation
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState(null)
  const [genError, setGenError] = useState(null)

  // Section B: Manual add
  const [manualUrl, setManualUrl] = useState('')
  const [addingManual, setAddingManual] = useState(false)
  const [manualResult, setManualResult] = useState(null)
  const [manualError, setManualError] = useState(null)

  // Section C: Published articles
  const [articles, setArticles] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [lastPublished, setLastPublished] = useState(null)

  // Section D: Prompts
  const [promptsExpanded, setPromptsExpanded] = useState(false)
  const [selectionPrompt, setSelectionPrompt] = useState(DEFAULT_SELECTION_PROMPT)
  const [summaryPrompt, setSummaryPrompt] = useState(DEFAULT_SUMMARY_PROMPT)
  const [savingPrompts, setSavingPrompts] = useState(false)
  const [promptsSaved, setPromptsSaved] = useState(false)

  // Preview modal
  const [previewArticle, setPreviewArticle] = useState(null)
  const [previewLang, setPreviewLang] = useState('en')

  useEffect(() => {
    loadArticles()
    loadPrompts()
  }, [])

  async function loadArticles() {
    setLoadingArticles(true)
    try {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(100)

      setArticles(data || [])
      if (data && data.length > 0) {
        setLastPublished(data[0].published_at)
      }
    } catch (err) {
      console.error('Load articles error:', err)
    } finally {
      setLoadingArticles(false)
    }
  }

  async function loadPrompts() {
    try {
      const { data: selData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'news_selection_prompt')
        .single()
      if (selData?.value) setSelectionPrompt(selData.value)
    } catch {}
    try {
      const { data: sumData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'news_summary_prompt')
        .single()
      if (sumData?.value) setSummaryPrompt(sumData.value)
    } catch {}
  }

  // Section A: Generate today's news
  async function handleGenerate() {
    setGenerating(true)
    setGenResult(null)
    setGenError(null)
    try {
      const { data, error } = await supabase.functions.invoke('generate-summaries', {
        body: { selectionPrompt, summaryPrompt },
      })
      if (error) throw error
      setGenResult(data)
      await loadArticles()
    } catch (err) {
      setGenError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  // Section B: Manual add
  async function handleManualAdd() {
    if (!manualUrl.trim()) return
    setAddingManual(true)
    setManualResult(null)
    setManualError(null)
    try {
      const { data, error } = await supabase.functions.invoke('generate-summaries', {
        body: { manualUrl: manualUrl.trim() },
      })
      if (error) throw error
      setManualResult('Article added successfully!')
      setManualUrl('')
      await loadArticles()
    } catch (err) {
      setManualError(err.message || 'Failed to add article')
    } finally {
      setAddingManual(false)
    }
  }

  // Section C: Unpublish
  async function handleUnpublish(articleId) {
    try {
      await supabase
        .from('news_articles')
        .update({ is_published: false })
        .eq('id', articleId)
      setArticles((prev) => prev.filter((a) => a.id !== articleId))
    } catch (err) {
      console.error('Unpublish error:', err)
    }
  }

  // Section D: Save prompts
  async function handleSavePrompts() {
    setSavingPrompts(true)
    setPromptsSaved(false)
    try {
      await supabase
        .from('app_settings')
        .upsert({ key: 'news_selection_prompt', value: selectionPrompt }, { onConflict: 'key' })
      await supabase
        .from('app_settings')
        .upsert({ key: 'news_summary_prompt', value: summaryPrompt }, { onConflict: 'key' })
      setPromptsSaved(true)
      setTimeout(() => setPromptsSaved(false), 3000)
    } catch (err) {
      console.error('Save prompts error:', err)
    } finally {
      setSavingPrompts(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">News Generation</h1>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
            AI-powered
          </span>
        </div>
        <p className="text-sm text-[#6B7280] mt-1">
          Generate and manage newsletter summaries
        </p>
      </div>

      <div className="space-y-6">
        {/* ─── Section A: Auto Generation ─── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-purple-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Automatic Generation
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1B3D2F] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              '🚀 Generate Today\'s News'
            )}
          </button>

          {generating && (
            <p className="text-sm text-[#6B7280] mt-3 animate-pulse">
              Analyzing articles, selecting top stories, generating summaries...
            </p>
          )}

          {genResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 font-medium">Generation complete!</p>
              {genResult.analyzed != null && (
                <p className="text-xs text-green-700 mt-1">
                  {genResult.analyzed} articles analyzed · {genResult.selected} selected · {genResult.summarized} summarized
                </p>
              )}
            </div>
          )}

          {genError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{genError}</p>
            </div>
          )}

          {lastPublished && (
            <p className="text-xs text-[#6B7280] mt-3">
              Last run: {formatDate(lastPublished)}
            </p>
          )}
        </Card>

        {/* ─── Section B: Manual Add ─── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon size={16} className="text-blue-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Add Article Manually
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Paste article URL here..."
              disabled={addingManual}
              className="flex-1 border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] disabled:opacity-50"
              onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
            />
            <button
              onClick={handleManualAdd}
              disabled={addingManual || !manualUrl.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
            >
              {addingManual ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Generate Summary
            </button>
          </div>

          {manualResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 font-medium">{manualResult}</p>
            </div>
          )}

          {manualError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{manualError}</p>
            </div>
          )}
        </Card>

        {/* ─── Section C: Published Articles ─── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#D1D5DB] bg-gray-50/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Published Articles ({articles.length})
            </p>
          </div>

          {loadingArticles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-[#6B7280] animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#6B7280]">No published articles yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Thumbnail */}
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="text-lg">📰</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {article.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {article.source_name}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(article.published_at)}
                      </span>
                      {article.category && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                          {article.category}
                        </span>
                      )}
                    </div>
                    {(article.summary_en || article.description) && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {(article.summary_en || article.description || '').slice(0, 150)}...
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setPreviewArticle(article); setPreviewLang('en') }}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:bg-gray-100 transition-colors"
                      title="Preview summary"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleUnpublish(article.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Unpublish"
                    >
                      <EyeOff size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ─── Section D: AI Prompts ─── */}
        <Card className="p-0 overflow-hidden">
          <button
            onClick={() => setPromptsExpanded(!promptsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                AI Prompts
              </p>
            </div>
            {promptsExpanded ? (
              <ChevronUp size={16} className="text-[#6B7280]" />
            ) : (
              <ChevronDown size={16} className="text-[#6B7280]" />
            )}
          </button>

          {promptsExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Selection Prompt
                </label>
                <textarea
                  value={selectionPrompt}
                  onChange={(e) => setSelectionPrompt(e.target.value)}
                  rows={4}
                  className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] resize-y"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Summary Prompt
                </label>
                <textarea
                  value={summaryPrompt}
                  onChange={(e) => setSummaryPrompt(e.target.value)}
                  rows={4}
                  className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] resize-y"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePrompts}
                  disabled={savingPrompts}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {savingPrompts ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  Save Prompts
                </button>
                {promptsSaved && (
                  <span className="text-sm text-green-600 font-medium">✓ Saved</span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Preview Modal ─── */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
              <h2 className="text-lg font-bold text-[#1A1A1A] truncate mr-4">
                {previewArticle.title}
              </h2>
              <button
                onClick={() => setPreviewArticle(null)}
                className="text-[#6B7280] hover:text-[#1A1A1A] shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Image */}
            {previewArticle.image_url && (
              <img
                src={previewArticle.image_url}
                alt=""
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}

            {/* Language tabs */}
            <div className="flex gap-1 px-6 pt-4">
              {['en', 'fr', 'it', 'es'].map((lng) => (
                <button
                  key={lng}
                  onClick={() => setPreviewLang(lng)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                    previewLang === lng
                      ? 'bg-[#1B3D2F] text-white'
                      : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>

            {/* Summary content */}
            <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-1">
                {previewArticle.title}
              </p>
              <p className="text-xs text-[#6B7280] mb-4">
                {previewArticle.source_name} · {formatDate(previewArticle.published_at)}
              </p>
              <div className="space-y-3">
                {(previewArticle[`summary_${previewLang}`] || previewArticle.summary_en || previewArticle.description || 'No summary available')
                  .split('\n\n')
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-[#D1D5DB]">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
