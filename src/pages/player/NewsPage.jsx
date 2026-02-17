import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { Newspaper, ExternalLink, Star } from 'lucide-react'

/**
 * NewsPage — dark-themed news feed with language-aware article list.
 * Fetches articles from news_articles table filtered by user language.
 * Handles cleanup on unmount to prevent stale state on back-navigation.
 */
export default function NewsPage() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  const lang = profile?.language || localStorage.getItem('akka_lang') || 'en'

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Fetch articles — with cleanup flag to prevent state updates after unmount
  useEffect(() => {
    let cancelled = false

    async function fetchArticles() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('news_articles')
          .select('*')
          .eq('is_active', true)
          .eq('language', lang)
          .order('published_at', { ascending: false })

        if (!cancelled) {
          if (error) {
            console.error('Error fetching articles:', error)
            setArticles([])
          } else {
            setArticles(data || [])
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Fetch error:', err)
          setArticles([])
          setLoading(false)
        }
      }
    }

    fetchArticles()

    return () => {
      cancelled = true
    }
  }, [lang])

  // Extract unique categories from loaded articles
  const categories = ['All', ...new Set(articles.map((a) => a.category).filter(Boolean))]

  // Filter articles by selected category
  const filtered =
    selectedCategory === 'All'
      ? articles
      : articles.filter((a) => a.category === selectedCategory)

  const featured = filtered.find((a) => a.is_featured)
  const rest = filtered.filter((a) => !a.is_featured)

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : lang === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-akka-news-bg px-4 pt-6 pb-24">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-4">News</h1>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-akka-green text-white'
                  : 'bg-akka-news-surface text-white/60 hover:text-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-akka-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-akka-news-surface flex items-center justify-center mb-4">
            <Newspaper size={32} className="text-akka-green" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No articles yet</h2>
          <p className="text-white/50 text-center text-sm">
            News articles for your language will appear here.
          </p>
        </div>
      )}

      {/* Featured article */}
      {!loading && featured && (
        <a
          href={featured.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4 rounded-2xl overflow-hidden bg-akka-news-surface"
        >
          {featured.image_url && (
            <img
              src={featured.image_url}
              alt={featured.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold">Featured</span>
              {featured.category && (
                <span className="text-white/40 text-xs">
                  {featured.category}
                </span>
              )}
            </div>
            <h2 className="text-white font-bold text-lg leading-tight mb-2">
              {featured.title}
            </h2>
            {featured.description && (
              <p className="text-white/60 text-sm line-clamp-2">{featured.description}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-white/40 text-xs">
                {featured.source_name} &middot; {formatDate(featured.published_at)}
              </span>
              <ExternalLink size={14} className="text-white/40" />
            </div>
          </div>
        </a>
      )}

      {/* Article list */}
      {!loading &&
        rest.map((article) => (
          <a
            key={article.id}
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 mb-3 p-3 rounded-xl bg-akka-news-surface hover:bg-akka-news-surface/80 transition-colors"
          >
            {article.image_url && (
              <img
                src={article.image_url}
                alt=""
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1">
                {article.title}
              </h3>
              {article.description && (
                <p className="text-white/50 text-xs line-clamp-1 mb-1.5">
                  {article.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                {article.category && (
                  <span className="text-akka-green text-[10px] font-semibold">
                    {article.category}
                  </span>
                )}
                <span className="text-white/30 text-[10px]">
                  {article.source_name} &middot; {formatDate(article.published_at)}
                </span>
              </div>
            </div>
          </a>
        ))}
    </div>
  )
}
