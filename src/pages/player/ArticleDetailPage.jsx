import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLang } from '../../hooks/useLang'
import { supabase } from '../../lib/supabase'

export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { lang: userLang } = useLang()

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

        {/* Summary paragraphs */}
        {summary.split('\n\n').map((p, i) => (
          <p key={i} className="text-gray-700 leading-relaxed mb-4 text-[15px]">{p}</p>
        ))}

      </div>
    </div>
  )
}
