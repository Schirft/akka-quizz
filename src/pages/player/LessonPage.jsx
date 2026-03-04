import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../../hooks/useLang'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-react'

/**
 * LessonPage — displays the "Lesson of the Day".
 * Receives lessonId from location.state.
 */

export default function LessonPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useLang()

  const lessonId = location.state?.lessonId

  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lessonId) {
      setLoading(false)
      return
    }
    loadLesson()
  }, [lessonId])

  async function loadLesson() {
    const { data } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('id', lessonId)
      .single()
    setLesson(data)
    setLoading(false)
  }

  function getLang(key) {
    if (!lesson) return ''
    return lesson[`${key}_${lang}`] || lesson[`${key}_en`] || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 size={24} className="text-[#1B3D2F] animate-spin" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <p className="text-4xl mb-4">📖</p>
        <h2 className="text-lg font-bold mb-2">Lesson Not Found</h2>
        <button onClick={() => navigate('/')} className="text-sm text-[#1B3D2F] underline mt-4">
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-[#6B7280]" />
        </button>
        <div>
          <p className="text-xs uppercase tracking-wider text-amber-600 font-bold">
            Lesson of the Day
          </p>
          <p className="text-[10px] text-[#6B7280]">{lesson.theme}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-4">{getLang('title')}</h1>

        {/* Video placeholder */}
        <div className="w-full aspect-video bg-gradient-to-br from-[#1B3D2F] to-[#2D5A45] rounded-2xl flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <span className="text-white text-2xl ml-1">▶</span>
          </div>
          <p className="text-white/70 text-xs">Video coming soon</p>
        </div>

        {/* Lesson text */}
        <div className="space-y-3">
          {getLang('content')
            .split('\n')
            .filter(Boolean)
            .map((p, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">
                {p}
              </p>
            ))}
        </div>

        {/* Key takeaway */}
        {getLang('key_takeaway') && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">
              Key Takeaway
            </p>
            <p className="text-sm text-amber-900 font-medium leading-relaxed">
              {getLang('key_takeaway')}
            </p>
          </div>
        )}
      </div>

      {/* Done button */}
      <div className="px-4 py-4">
        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 bg-[#1B3D2F] text-white font-bold rounded-xl text-sm"
        >
          Done — Back to Home
        </button>
      </div>
    </div>
  )
}
