import { Newspaper } from 'lucide-react'

/**
 * NewsPage — placeholder for the dark-themed news feed.
 */
export default function NewsPage() {
  return (
    <div className="min-h-screen bg-akka-news-bg px-4 pt-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-6">News</h1>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-akka-news-surface flex items-center justify-center mb-4">
          <Newspaper size={32} className="text-akka-green" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Startup News</h2>
        <p className="text-white/50 text-center">
          Curated startup and VC news from around Europe.
        </p>
        <p className="text-sm text-white/30 mt-4">Coming in Phase 4</p>
      </div>
    </div>
  )
}
