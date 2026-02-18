import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../hooks/useLang'
import { ArrowLeft, ExternalLink, Loader2, Clock } from 'lucide-react'

const CATEGORY_COLORS = {
  startup: 'bg-emerald-100 text-emerald-700',
  vc: 'bg-blue-100 text-blue-700',
  fintech: 'bg-amber-100 text-amber-700',
  ai: 'bg-purple-100 text-purple-700',
  crypto: 'bg-cyan-100 text-cyan-700',
  deeptech: 'bg-rose-100 text-rose-700',
}

const CATEGORY_GRADIENTS = {
  startup: 'from-emerald-600 to-teal-700',
  vc: 'from-blue-600 to-indigo-700',
  fintech: 'from-amber-500 to-orange-600',
  ai: 'from-purple-600 to-violet-700',
  crypto: 'from-cyan-500 to-blue-600',
  deeptech: 'from-rose-500 to-pink-600',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * ArticleDetailPage — Light newsletter-style article view.
 * Shows localized summary from summary_xx fields.
 * Receives article data via navigate state or fetches from Supabase as fallback.
 */
export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLang()
  const [article, setArticle] = useState(location.state?.article || null)
  const [loading, setLoading] = useState(!location.state?.article)

  useEffect(() => {
    if (!article) {
      loadArticle()
    }
  }, [id])

  async function loadArticle() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('news_articles')
        .select('*, summary_en, summary_fr, summary_it, summary_es')
        .eq('id', id)
        .single()

      setArticle(data)
    } catch (err) {
      console.error('Load article error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 size={24} className="text-[#1B3D2F] animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-4">
        <p className="text-gray-400 text-center mb-4">Article not found</p>
        <button
          onClick={() => navigate('/news')}
          className="text-[#1B3D2F] text-sm font-semibold"
        >
          Back to News
        </button>
      </div>
    )
  }

  // Pick localized summary
  const summaryMap = {
    fr: article.summary_fr,
    it: article.summary_it,
    es: article.summary_es,
    en: article.summary_en,
  }
  const summary = summaryMap[lang] || article.summary_en || article.description || ''
  const summaryParagraphs = summary.split(/\n\n/).filter(Boolean)

  const categoryStyle = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-600'
  const gradient = CATEGORY_GRADIENTS[article.category] || 'from-emerald-600 to-teal-700'

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-md">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/news')}
            className="flex items-center gap-1.5 text-[#1B3D2F] text-sm font-medium"
          >
            <ArrowLeft size={18} />
            <span>News</span>
          </button>
        </div>
      </div>

      {/* Hero image — full width */}
      <div className="relative w-full h-[220px]">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
        )}
      </div>

      {/* Article content */}
      <div className="px-4 pt-5 pb-24">
        {/* Category pill */}
        {article.category && (
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${categoryStyle}`}>
            {article.category}
          </span>
        )}

        {/* Title */}
        <h1 className="text-xl font-bold text-[#111827] leading-tight mb-3">
          {article.title}
        </h1>

        {/* Source & date meta */}
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-6">
          {article.source_name && (
            <span className="font-medium text-gray-500">{article.source_name}</span>
          )}
          {article.published_at && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {formatDate(article.published_at)}
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 mb-6" />

        {/* Summary paragraphs */}
        <div className="space-y-4">
          {summaryParagraphs.map((para, idx) => (
            <p
              key={idx}
              className="text-[15px] leading-relaxed text-gray-700"
            >
              {para}
            </p>
          ))}
        </div>

        {/* Fallback if no summary */}
        {summaryParagraphs.length === 0 && article.description && (
          <p className="text-[15px] leading-relaxed text-gray-700">
            {(article.description || '').replace(/\s*\[\d+ chars\]$/, '')}
          </p>
        )}

        {/* Discrete source link */}
        {article.source_url && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#1B3D2F] text-sm font-medium hover:underline"
            >
              Read original article
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
