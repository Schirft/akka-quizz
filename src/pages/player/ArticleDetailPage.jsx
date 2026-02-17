import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Clock, ExternalLink, Loader2, Share2 } from 'lucide-react'

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

/**
 * ArticleDetailPage — Dark green premium article view.
 * Hero image at 45% viewport height, floating back button, drop cap first letter.
 */
export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      console.error('Load article error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    if (!article) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          url: article.source_url,
        })
      } else {
        await navigator.clipboard.writeText(article.source_url)
        alert('Link copied to clipboard!')
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B1A14] to-[#132A1F] flex items-center justify-center">
        <Loader2 size={24} className="text-[#2ECC71] animate-spin" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B1A14] to-[#132A1F] flex flex-col items-center justify-center px-4">
        <p className="text-white/50 text-center mb-4">Article not found</p>
        <button
          onClick={() => navigate('/news')}
          className="text-[#2ECC71] text-sm font-semibold"
        >
          Back to News
        </button>
      </div>
    )
  }

  const gradient = CATEGORY_GRADIENTS[article.category] || 'from-emerald-600 to-teal-700'
  // Split content into paragraphs
  const paragraphs = (article.content || article.description || '')
    .split(/\n\n|\n/)
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1A14] to-[#132A1F]">
      <div className="max-w-[430px] mx-auto relative">
        {/* Hero image — 45% viewport height */}
        <div className="relative h-[45vh] min-h-[280px]">
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
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1A14] via-[#0B1A14]/60 to-transparent" />

          {/* Floating back button */}
          <button
            onClick={() => navigate('/news')}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Floating share button */}
          <button
            onClick={handleShare}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
          >
            <Share2 size={16} />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6">
            {article.category && (
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#2ECC71] text-[10px] font-bold text-white uppercase tracking-wider mb-3">
                {article.category}
              </span>
            )}
            <h1 className="text-xl font-bold text-white leading-tight mb-2">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 text-white/50 text-xs">
              {article.source_name && (
                <span className="font-medium text-white/70">{article.source_name}</span>
              )}
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {formatDate(article.published_at)}
                </span>
              )}
              {article.published_at && (
                <span className="text-white/30">({timeAgo(article.published_at)})</span>
              )}
            </div>
          </div>
        </div>

        {/* Article body */}
        <div className="px-4 pt-6 pb-28">
          {/* Description highlight */}
          {article.description && article.content && (
            <p className="text-white/70 text-sm font-medium leading-relaxed mb-6 pb-6 border-b border-white/10">
              {article.description}
            </p>
          )}

          {/* Content paragraphs with drop cap */}
          <div className="space-y-4">
            {paragraphs.map((para, idx) => (
              <p
                key={idx}
                className={`text-white/60 text-sm leading-relaxed ${
                  idx === 0 ? 'first-letter:text-3xl first-letter:font-bold first-letter:text-[#2ECC71] first-letter:float-left first-letter:mr-1.5 first-letter:mt-0.5 first-letter:leading-none' : ''
                }`}
              >
                {para}
              </p>
            ))}
          </div>

          {/* No content fallback */}
          {paragraphs.length === 0 && article.description && (
            <p className="text-white/60 text-sm leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:text-[#2ECC71] first-letter:float-left first-letter:mr-1.5 first-letter:mt-0.5 first-letter:leading-none">
              {article.description}
            </p>
          )}
        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="max-w-[430px] mx-auto">
            <div className="mx-4 mb-4 rounded-2xl bg-[#1A3529]/90 backdrop-blur-xl border border-white/10 p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs text-white/40 truncate">
                  {article.source_name || 'Source'}
                </p>
              </div>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#2ECC71] text-white text-sm font-bold rounded-xl hover:bg-[#27AE60] transition-colors shrink-0"
              >
                Read Full Article
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
