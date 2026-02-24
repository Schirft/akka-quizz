import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLang } from '../../hooks/useLang'
import { supabase } from '../../lib/supabase'
import { Zap, Lightbulb } from 'lucide-react'

/** Render a paragraph with bold markdown support (**text**) */
function RichText({ text, className }) {
  if (!text) return null
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return (
    <p className={className}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
          : part
      )}
    </p>
  )
}

/** Parse summary into structured blocks: key_fact, takeaway, regular paragraphs */
function parseSummary(text) {
  if (!text) return []
  const blocks = []
  const paragraphs = text.split('\n\n')
  for (const p of paragraphs) {
    const trimmed = p.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('[KEY_FACT]')) {
      blocks.push({ type: 'key_fact', text: trimmed.replace('[KEY_FACT]', '').trim() })
    } else if (trimmed.startsWith('[TAKEAWAY]')) {
      blocks.push({ type: 'takeaway', text: trimmed.replace('[TAKEAWAY]', '').trim() })
    } else {
      blocks.push({ type: 'paragraph', text: trimmed })
    }
  }
  return blocks
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang: userLang, t } = useLang()

  const [article, setArticle] = useState(location.state?.article || null)
  const [loading, setLoading] = useState(!article)

  useEffect(() => {
    if (!article && id) {
      supabase
        .from('news_articles')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) setArticle(data)
          setLoading(false)
        })
    }
  }, [id, article])

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]"><div className="w-8 h-8 border-3 border-[#1B3D2F] border-t-transparent rounded-full animate-spin" /></div>
  if (!article) return <div className="p-6 text-center text-gray-500">Article not found</div>

  // Get summary in user's language with fallback to EN
  const lang = userLang || 'en'

  // Redirect if article is hidden in user's language
  const hiddenLangs = article.hidden_langs || []
  if (hiddenLangs.includes(lang)) {
    navigate('/news', { replace: true })
    return null
  }
  const localizedTitle = article[`title_${lang}`] || article.title_en || article.title || ''
  const summary = article[`summary_${lang}`] || article.summary_en || article.description || ''
  const date = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-[#F8F9FA]/80 backdrop-blur-md px-4 py-3">
        <button onClick={() => navigate('/news')} className="flex items-center gap-2 text-[#1B3D2F] font-medium">
          <span>←</span> News
        </button>
      </div>

      {/* Hero image */}
      {article.image_url && (
        <div className="px-4">
          <img src={article.image_url} alt="" className="w-full h-56 object-cover rounded-2xl" />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4 pb-32">
        {/* Category pill */}
        {article.category && (
          <span className="inline-block bg-[#1B3D2F]/10 text-[#1B3D2F] text-xs font-medium px-3 py-1 rounded-full mb-3">
            {article.category}
          </span>
        )}

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-2">{localizedTitle}</h1>

        {/* Date */}
        {date && <p className="text-sm text-gray-500 mb-4">{date}</p>}

        <hr className="border-gray-200 mb-4" />

        {/* Summary — structured blocks */}
        {parseSummary(summary).map((block, i) => {
          if (block.type === 'key_fact') {
            return (
              <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
                <Zap size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{t('key_fact')}</span>
                  <RichText text={block.text} className="text-emerald-900 text-[15px] leading-relaxed mt-1" />
                </div>
              </div>
            )
          }
          if (block.type === 'takeaway') {
            return (
              <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                <Lightbulb size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{t('takeaway')}</span>
                  <RichText text={block.text} className="text-amber-900 text-[15px] leading-relaxed mt-1" />
                </div>
              </div>
            )
          }
          return <RichText key={i} text={block.text} className="text-gray-700 leading-relaxed mb-4 text-[15px]" />
        })}

      </div>
    </div>
  )
}
