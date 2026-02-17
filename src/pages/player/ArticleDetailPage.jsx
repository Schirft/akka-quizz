import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../hooks/useLang'
import TabBar from '../../components/layout/TabBar'
import { ArrowLeft, Loader2 } from 'lucide-react'

function formatDate(dateStr, lang) {
  if (!dateStr) return ''
  const locales = { en: 'en-US', fr: 'fr-FR', es: 'es-ES', it: 'it-IT' }
  return new Date(dateStr).toLocaleDateString(locales[lang] || 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * ArticleDetailPage — Dark green premium article view.
 * Hero image at 45% viewport height, floating back button, drop cap first letter.
 */
export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang } = useLang()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticle()
  }, [id])

  async function loadArticle() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', id)
        .single()

      setArticle(data)
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Load article error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={24} className="text-[#2ECC71] animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <p className="text-gray-400 text-center mb-4">Article not found</p>
        <button
          onClick={() => navigate('/news')}
          className="text-[#2ECC71] text-sm font-semibold"
        >
          ← Back to News
        </button>
      </div>
    )
  }

  // Split content into paragraphs
  const fullText = article.content || article.description || ''
  const paragraphs = fullText.split(/\n\n|\n/).filter(Boolean)

  // Show description separately only if content also exists (avoid duplicating)
  const showDescriptionSeparately = article.description && article.content && !article.content.startsWith(article.description)

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-[430px] mx-auto">
        {/* Back button */}
        <div className="px-5 py-4">
          <button
            onClick={() => navigate('/news')}
            className="flex items-center gap-1.5 text-gray-500 text-sm font-medium hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
            News
          </button>
        </div>

        {/* Hero image */}
        {article.image_url && (
          <div className="px-5 mb-5">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-[220px] object-cover rounded-2xl"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        )}

        {/* Article content */}
        <div className="px-5">
          {/* Category pill */}
          {article.category && (
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#2ECC71]/10 text-[11px] font-bold text-[#2ECC71] uppercase tracking-wider mb-3">
              {article.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-[#1A1A1A] leading-tight mb-3">
            {article.title}
          </h1>

          {/* Source + date */}
          <p className="text-sm text-gray-500 mb-6">
            {article.source_name && <span>{article.source_name}</span>}
            {article.source_name && article.published_at && <span> · </span>}
            {article.published_at && <span>{formatDate(article.published_at, lang)}</span>}
          </p>

          {/* Description as lead paragraph */}
          {showDescriptionSeparately && (
            <p className="text-base text-gray-800 font-medium leading-relaxed mb-6 pb-6 border-b border-gray-100">
              {article.description}
            </p>
          )}

          {/* Content paragraphs */}
          <div className="space-y-4">
            {paragraphs.map((para, idx) => (
              <p key={idx} className="text-base text-gray-700 leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* No content fallback — show description as body */}
          {paragraphs.length === 0 && article.description && !showDescriptionSeparately && (
            <p className="text-base text-gray-700 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Discreet source link at bottom */}
          {article.source_url && (
            <div className="mt-10 pt-4 border-t border-gray-100">
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
              >
                Source originale ↗
              </a>
            </div>
          )}
        </div>
      </div>

      <TabBar />
    </div>
  )
}
