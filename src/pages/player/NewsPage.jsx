import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../hooks/useLang'
import { Loader2 } from 'lucide-react'

const CATEGORIES = ['top_news', 'startup', 'vc', 'fintech', 'ai', 'crypto', 'markets']

const CATEGORY_GRADIENTS = {
  startup: 'from-emerald-600 to-teal-700',
  vc: 'from-blue-600 to-indigo-700',
  fintech: 'from-amber-500 to-orange-600',
  ai: 'from-purple-600 to-violet-700',
  crypto: 'from-cyan-500 to-blue-600',
  markets: 'from-rose-500 to-pink-600',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** Helper: get localized title with fallback chain */
function getLocalizedTitle(article, lang) {
  return article[`title_${lang}`] || article.title_en || article.title || ''
}

/**
 * NewsPage — Dark green premium news feed.
 * Fetches articles from Supabase, filtered by user language.
 */
export default function NewsPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const [articles, setArticles] = useState([])
  const [featured, setFeatured] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    let cancelled = false

    async function loadArticles() {
      setLoading(true)
      try {
        let query = supabase
          .from('news_articles')
          .select('*, title_en, title_fr, title_it, title_es, summary_en, summary_fr, summary_it, summary_es, hidden_langs, is_top_news')
          .eq('is_active', true)
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(50)

        if (activeCategory === 'top_news') {
          query = query.eq('is_top_news', true)
        } else if (activeCategory && activeCategory !== 'all') {
          query = query.eq('category', activeCategory)
        }

        const { data } = await query
        if (cancelled) return

        // Filter: only show articles with a summary in the user's language + not hidden
        const summaryField = `summary_${lang}`
        const withSummary = (data || []).filter((a) => {
          const hasContent = a[summaryField] && a[summaryField].length > 50
          const notHidden = !(a.hidden_langs || []).includes(lang)
          return hasContent && notHidden
        })

        if (withSummary.length > 0) {
          const feat = withSummary.find((a) => a.is_featured) || withSummary[0]
          setFeatured(feat)
          setArticles(withSummary.filter((a) => a.id !== feat.id))
        } else {
          setFeatured(null)
          setArticles([])
        }
      } catch (err) {
        if (!cancelled) {
          if (err?.name !== 'AbortError') console.error('Load news error:', err)
          setFeatured(null)
          setArticles([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadArticles()
    return () => { cancelled = true }
  }, [lang, activeCategory])

  const filtered = activeCategory === 'all'
    ? articles
    : activeCategory === 'top_news'
      ? articles.filter((a) => a.is_top_news)
      : articles.filter((a) => a.category === activeCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1A14] to-[#132A1F]">
      <div className="max-w-[430px] mx-auto px-4 pt-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">News</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse" />
            <span className="text-[10px] font-medium text-white/60">Live</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-[#2ECC71] animate-spin" />
          </div>
        ) : (
          <>
            {/* Category pills — always visible */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              <button
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-[#2ECC71] text-white'
                    : 'bg-white/8 text-white/50 hover:bg-white/12'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? cat === 'top_news' ? 'bg-amber-400 text-black font-bold' : 'bg-[#2ECC71] text-white'
                      : cat === 'top_news' ? 'bg-amber-400/15 text-amber-400 hover:bg-amber-400/25' : 'bg-white/8 text-white/50 hover:bg-white/12'
                  }`}
                >
                  {cat === 'top_news' ? (
                    <span>Top News</span>
                  ) : (
                    <span className="capitalize">{cat}</span>
                  )}
                </button>
              ))}
            </div>

            {!featured && articles.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-xl font-bold text-white mb-2">No articles in this category</h2>
                <p className="text-white/40 text-center text-sm">
                  Try selecting a different category above.
                </p>
              </div>
            ) : (
              <>
                {/* Featured article hero */}
                {featured && (
              <div
                onClick={() => navigate(`/news/${featured.id}`, { state: { article: featured } })}
                className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer group"
              >
                {featured.image_url ? (
                  <img
                    src={featured.image_url}
                    alt={getLocalizedTitle(featured, lang)}
                    className="w-full h-[220px] object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className={`w-full h-[220px] bg-gradient-to-br ${CATEGORY_GRADIENTS[featured.category] || 'from-emerald-600 to-teal-700'}`} />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                {/* Glow effect */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[#2ECC71]/20 blur-2xl rounded-full" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {featured.category && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#2ECC71] text-[10px] font-bold text-white uppercase tracking-wider mb-2">
                      {featured.category}
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-white leading-tight mb-1.5 line-clamp-2">
                    {getLocalizedTitle(featured, lang)}
                  </h2>
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    {featured.published_at && (
                      <span>{timeAgo(featured.published_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Article cards */}
            <div className="space-y-3">
              {filtered.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/news/${article.id}`, { state: { article } })}
                  className="flex gap-3 p-3 rounded-xl bg-[#1A3529]/40 backdrop-blur-sm border border-white/5 cursor-pointer hover:bg-[#1A3529]/60 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.parentNode.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[article.category] || 'from-emerald-600 to-teal-700'} flex items-center justify-center"><span class="text-white/60 text-2xl">📰</span></div>`
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[article.category] || 'from-emerald-600 to-teal-700'} flex items-center justify-center`}>
                        <span className="text-white/60 text-2xl">📰</span>
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {article.category && (
                          <span className="text-[10px] font-semibold text-[#2ECC71] uppercase tracking-wider">
                            {article.category}
                          </span>
                        )}
                        {article.is_top_news && (
                          <span className="text-[10px] font-bold text-orange-400">
                            Top
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 mt-0.5">
                        {getLocalizedTitle(article, lang)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-[10px] mt-1">
                      {article.published_at && (
                        <span>{timeAgo(article.published_at)}</span>
                      )}
                    </div>
                  </div>

                  <span className="text-white/20 shrink-0 self-center">›</span>
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">
                  No articles in this category
                </p>
              )}
            </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
