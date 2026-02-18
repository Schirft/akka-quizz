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
  RotateCcw,
  BarChart3,
  Globe,
  Clock,
} from 'lucide-react'

// ── Default prompts ──
const DEFAULT_SELECTION_PROMPT = `You are the editor-in-chief of a daily newsletter for European startup investors.
From the raw article list provided, select the 5-10 most impactful stories.
Prioritize: funding rounds > €5 M, major product launches, regulatory changes affecting startups,
notable exits or IPOs, and AI/deeptech breakthroughs.
Return ONLY a JSON array of the selected article URLs, no commentary.`

const DEFAULT_SUMMARY_PROMPT = `You are a senior analyst writing for a premium startup investment newsletter.
Given an article's full text, produce a compelling summary (3-5 short paragraphs).
Lead with the key number or fact. Add context on why this matters for investors.
Close with a forward-looking sentence. Keep the tone sharp, data-driven, and professional.
Write in the language specified by the "language" parameter (en, fr, it, or es).`

const LANGS = ['en', 'fr', 'it', 'es']
const ARTICLE_COUNTS = [5, 10, 15]

export default function AdminNewsPage() {
  // ── Section A: Auto generation ──
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState(null)
  const [genError, setGenError] = useState(null)
  const [progressMessage, setProgressMessage] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [articleCount, setArticleCount] = useState(10)
  const [selectedLangs, setSelectedLangs] = useState(['en', 'fr'])

  // ── Section B: Manual add ──
  const [manualUrl, setManualUrl] = useState('')
  const [addingManual, setAddingManual] = useState(false)
  const [manualResult, setManualResult] = useState(null)
  const [manualError, setManualError] = useState(null)

  // ── Section C: Published articles ──
  const [articles, setArticles] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [langFilter, setLangFilter] = useState('all')

  // ── Section D: Prompts ──
  const [promptsExpanded, setPromptsExpanded] = useState(false)
  const [selectionPrompt, setSelectionPrompt] = useState(DEFAULT_SELECTION_PROMPT)
  const [summaryPrompt, setSummaryPrompt] = useState(DEFAULT_SUMMARY_PROMPT)
  const [savingPrompts, setSavingPrompts] = useState(false)
  const [promptsSaved, setPromptsSaved] = useState(false)

  // ── Section E: Stats ──
  const [stats, setStats] = useState({ total: 0, languages: 0, lastRun: null })

  // ── Preview modal ──
  const [previewArticle, setPreviewArticle] = useState(null)
  const [previewLang, setPreviewLang] = useState('en')

  // ── Init ──
  useEffect(() => {
    loadArticles()
    loadPrompts()
  }, [])

  // ── Load articles ──
  async function loadArticles() {
    setLoadingArticles(true)
    try {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(200)

      const list = data || []
      setArticles(list)

      // Compute stats
      const langSet = new Set(list.map((a) => a.language).filter(Boolean))
      setStats({
        total: list.length,
        languages: langSet.size,
        lastRun: list.length > 0 ? list[0].published_at : null,
      })
    } catch (err) {
      console.error('Load articles error:', err)
    } finally {
      setLoadingArticles(false)
    }
  }

  // ── Load prompts from app_settings ──
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

  // ── Toggle language checkbox ──
  function toggleLang(lang) {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    )
  }

  // ── Section A: Generate — multi-step ──
  async function handleGenerate() {
    if (selectedLangs.length === 0) return
    setGenerating(true)
    setGenResult(null)
    setGenError(null)
    setProgressPercent(0)
    setProgressMessage('')

    const totalSteps = selectedLangs.length + 1
    let totalSummarized = 0

    try {
      // Step 1: Fetch fresh news
      setProgressMessage(`Step 1/${totalSteps} — Fetching fresh articles...`)
      setProgressPercent(5)
      const { error: fetchErr } = await supabase.functions.invoke('fetch-news', { body: {} })
      if (fetchErr) console.warn('fetch-news warning:', fetchErr)

      // Steps 2-N: Generate summaries per language
      for (let i = 0; i < selectedLangs.length; i++) {
        const lang = selectedLangs[i]
        const step = i + 2
        setProgressMessage(
          `Step ${step}/${totalSteps} — Generating ${lang.toUpperCase()} summaries...`,
        )
        setProgressPercent(Math.round(((step - 0.5) / totalSteps) * 100))

        try {
          const { data } = await supabase.functions.invoke('generate-summaries', {
            body: {
              language: lang,
              articleCount,
              selectionPrompt,
              summaryPrompt,
            },
          })
          totalSummarized += data?.summarized || 0
        } catch (err) {
          console.error(`Error for ${lang}:`, err)
        }
      }

      setProgressPercent(100)
      setProgressMessage('Done!')
      setGenResult(
        `${totalSummarized} articles generated across ${selectedLangs.length} language${selectedLangs.length > 1 ? 's' : ''}`,
      )
      await loadArticles()
    } catch (err) {
      setGenError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  // ── Section B: Manual add ──
  async function handleManualAdd() {
    if (!manualUrl.trim()) return
    setAddingManual(true)
    setManualResult(null)
    setManualError(null)
    try {
      const { error } = await supabase.functions.invoke('generate-summaries', {
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

  // ── Section C: Unpublish ──
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

  // ── Section D: Save prompts ──
  async function handleSavePrompts() {
    setSavingPrompts(true)
    setPromptsSaved(false)
    try {
      await supabase
        .from('app_settings')
        .upsert(
          { key: 'news_selection_prompt', value: selectionPrompt },
          { onConflict: 'key' },
        )
      await supabase
        .from('app_settings')
        .upsert(
          { key: 'news_summary_prompt', value: summaryPrompt },
          { onConflict: 'key' },
        )
      setPromptsSaved(true)
      setTimeout(() => setPromptsSaved(false), 3000)
    } catch (err) {
      console.error('Save prompts error:', err)
    } finally {
      setSavingPrompts(false)
    }
  }

  // ── Reset prompts to defaults ──
  function handleResetPrompts() {
    setSelectionPrompt(DEFAULT_SELECTION_PROMPT)
    setSummaryPrompt(DEFAULT_SUMMARY_PROMPT)
  }

  // ── Helpers ──
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

  // ── Filtered articles by language ──
  const filteredArticles =
    langFilter === 'all'
      ? articles
      : articles.filter((a) => a.language === langFilter)

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

      {/* ─── Section E: Stats Bar ─── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="flex items-center gap-3 !py-3">
          <div className="w-9 h-9 rounded-lg bg-[#1B3D2F]/10 flex items-center justify-center shrink-0">
            <BarChart3 size={16} className="text-[#1B3D2F]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#1A1A1A]">{stats.total}</p>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Published</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 !py-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Globe size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#1A1A1A]">{stats.languages}</p>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Languages</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 !py-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1A1A1A] leading-tight">
              {stats.lastRun ? formatDate(stats.lastRun) : '—'}
            </p>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wide">Last Run</p>
          </div>
        </Card>
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

          {/* Article count selector */}
          <div className="mb-4">
            <label className="block mb-1.5 text-xs font-medium text-[#6B7280]">
              Articles per language
            </label>
            <div className="flex gap-2">
              {ARTICLE_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setArticleCount(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    articleCount === n
                      ? 'bg-[#1B3D2F] text-white'
                      : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Language checkboxes */}
          <div className="mb-4">
            <label className="block mb-1.5 text-xs font-medium text-[#6B7280]">
              Languages to generate
            </label>
            <div className="flex gap-3">
              {LANGS.map((lng) => (
                <label
                  key={lng}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedLangs.includes(lng)}
                    onChange={() => toggleLang(lng)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1B3D2F] focus:ring-[#1B3D2F]"
                  />
                  <span className="text-sm font-medium text-[#1A1A1A] uppercase">
                    {lng}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || selectedLangs.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1B3D2F] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              `🚀 Generate ${articleCount} articles × ${selectedLangs.length} lang${selectedLangs.length > 1 ? 's' : ''}`
            )}
          </button>

          {/* Progress bar */}
          {generating && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm text-[#6B7280]">{progressMessage}</p>
                <span className="text-xs font-medium text-[#1B3D2F]">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B3D2F] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {genResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 font-medium">✓ {genResult}</p>
            </div>
          )}

          {genError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{genError}</p>
            </div>
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
              className="flex-1 border border-[#D1D5DB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3D2F] disabled:opacity-50"
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Published Articles ({filteredArticles.length})
              </p>
              {/* Language filter tabs */}
              <div className="flex gap-1">
                {['all', ...LANGS].map((lng) => (
                  <button
                    key={lng}
                    onClick={() => setLangFilter(lng)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                      langFilter === lng
                        ? 'bg-[#1B3D2F] text-white'
                        : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {lng}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingArticles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-[#6B7280] animate-spin" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#6B7280]">No published articles yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredArticles.map((article) => (
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
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
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
                        {formatDate(article.published_at)}
                      </span>
                      {article.category && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                            {article.category}
                          </span>
                        </>
                      )}
                      {article.language && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 uppercase">
                          {article.language}
                        </span>
                      )}
                    </div>
                    {(article.summary_en || article.description) && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {(article.summary_en || article.description || '').slice(0, 150)}
                        ...
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setPreviewArticle(article)
                        setPreviewLang('en')
                      }}
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
                  rows={5}
                  className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3D2F] resize-y"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Summary Prompt
                </label>
                <textarea
                  value={summaryPrompt}
                  onChange={(e) => setSummaryPrompt(e.target.value)}
                  rows={5}
                  className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3D2F] resize-y"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePrompts}
                  disabled={savingPrompts}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {savingPrompts ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Prompts
                </button>
                <button
                  onClick={handleResetPrompts}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset to Default
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
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}

            {/* Language tabs */}
            <div className="flex gap-1 px-6 pt-4">
              {LANGS.map((lng) => (
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
                {formatDate(previewArticle.published_at)}
              </p>
              <div className="space-y-3">
                {(
                  previewArticle[`summary_${previewLang}`] ||
                  previewArticle.summary_en ||
                  previewArticle.description ||
                  'No summary available'
                )
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
