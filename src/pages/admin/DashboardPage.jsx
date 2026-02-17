import { useState, useEffect } from 'react'
import { LayoutDashboard, Newspaper, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const GNEWS_KEY = '53798e3ace1583384a27a73cdfb2bd19'
const LANGUAGES = ['en', 'fr', 'it', 'es']

const NEWS_CATEGORIES = [
  {
    name: 'Funding',
    queries: {
      en: 'startup funding "series A"',
      fr: 'startup levée de fonds financement',
      it: 'startup finanziamento "serie A"',
      es: 'startup financiación inversión',
    },
  },
  {
    name: 'AI & Tech',
    queries: {
      en: 'artificial intelligence startup',
      fr: 'intelligence artificielle startup',
      it: 'intelligenza artificiale startup',
      es: 'inteligencia artificial startup',
    },
  },
  {
    name: 'VC & PE',
    queries: {
      en: 'venture capital private equity',
      fr: 'capital risque investissement',
      it: 'venture capital private equity',
      es: 'capital riesgo privado',
    },
  },
  {
    name: 'IPOs & Exits',
    queries: {
      en: 'startup IPO acquisition unicorn',
      fr: 'startup IPO acquisition licorne',
      it: 'startup IPO acquisizione unicorno',
      es: 'startup IPO adquisición unicornio',
    },
  },
  {
    name: 'Europe',
    queries: {
      en: 'startup Europe funding',
      fr: 'startup Europe financement',
      it: 'startup Europa finanziamento',
      es: 'startup Europa financiación',
    },
  },
  {
    name: 'Fintech',
    queries: {
      en: 'fintech startup funding',
      fr: 'fintech startup banque',
      it: 'fintech startup banca',
      es: 'fintech startup banco',
    },
  },
]

/**
 * DashboardPage — admin dashboard with stats cards + Seed Test News button.
 */
export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalQuestions: '—',
    approved: '—',
    pending: '—',
    aiGenerated: '—',
  })
  const [seeding, setSeeding] = useState(false)
  const [seedProgress, setSeedProgress] = useState('')
  const [seedResult, setSeedResult] = useState(null)

  // Load stats on mount
  useEffect(() => {
    async function loadStats() {
      const { count: total } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })

      const { count: approved } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      const { count: pending } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review')

      const { count: ai } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'ai')

      setStats({
        totalQuestions: total ?? 0,
        approved: approved ?? 0,
        pending: pending ?? 0,
        aiGenerated: ai ?? 0,
      })
    }

    loadStats()
  }, [])

  /**
   * Seed test news articles in all 4 languages (EN, FR, IT, ES).
   * 6 categories x 4 languages x 3 articles = up to 72 articles.
   * Rate-limited at 1 req/sec for GNews free plan.
   */
  async function seedTestArticles() {
    setSeeding(true)
    setSeedResult(null)
    let inserted = 0

    try {
      for (const cat of NEWS_CATEGORIES) {
        for (const lang of LANGUAGES) {
          setSeedProgress(`Seeding ${lang.toUpperCase()} — ${cat.name}...`)
          const query = cat.queries[lang] || cat.queries.en

          try {
            const res = await fetch(
              `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}&max=3&apikey=${GNEWS_KEY}`
            )
            const data = await res.json()

            for (const article of data.articles || []) {
              const { data: existing } = await supabase
                .from('news_articles')
                .select('id')
                .eq('source_url', article.url)
                .single()

              if (!existing) {
                await supabase.from('news_articles').insert({
                  title: article.title,
                  description: article.description,
                  content: article.content,
                  source_name: article.source?.name || 'Unknown',
                  source_url: article.url,
                  image_url: article.image,
                  category: cat.name,
                  language: lang,
                  published_at: article.publishedAt,
                  is_active: true,
                  is_featured: false,
                })
                inserted++
              }
            }

            // Rate limit GNews (1 req/sec free plan)
            await new Promise((r) => setTimeout(r, 1100))
          } catch (err) {
            console.error(`Error fetching ${cat.name}/${lang}:`, err)
          }
        }
      }

      // Mark most recent per language as featured
      setSeedProgress('Marking featured articles...')
      for (const lang of LANGUAGES) {
        await supabase
          .from('news_articles')
          .update({ is_featured: false })
          .eq('language', lang)

        const { data: latest } = await supabase
          .from('news_articles')
          .select('id')
          .eq('language', lang)
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1)
          .single()

        if (latest) {
          await supabase
            .from('news_articles')
            .update({ is_featured: true })
            .eq('id', latest.id)
        }
      }

      setSeedResult({ success: true, count: inserted })
    } catch (err) {
      console.error('Seed error:', err)
      setSeedResult({ success: false, error: err.message })
    } finally {
      setSeeding(false)
      setSeedProgress('')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-akka-text mb-6">Admin Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Questions', value: stats.totalQuestions },
          { label: 'Approved', value: stats.approved },
          { label: 'Pending Review', value: stats.pending },
          { label: 'AI Generated', value: stats.aiGenerated },
        ].map(({ label, value }) => (
          <Card key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-akka-text">{value}</p>
          </Card>
        ))}
      </div>

      {/* Seed Test News section */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Newspaper size={20} className="text-akka-green" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-akka-text">Seed Test News</h2>
            <p className="text-xs text-akka-text-secondary">
              Fetch articles from GNews in EN, FR, IT, ES (up to 72 articles)
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full gap-2"
          onClick={seedTestArticles}
          disabled={seeding}
        >
          {seeding ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {seedProgress || 'Seeding...'}
            </>
          ) : (
            <>
              <Newspaper size={18} />
              Seed Test News (4 Languages)
            </>
          )}
        </Button>

        {seedResult && (
          <p
            className={`text-xs text-center mt-2 ${
              seedResult.success ? 'text-akka-green' : 'text-red-500'
            }`}
          >
            {seedResult.success
              ? `Done! ${seedResult.count} articles inserted.`
              : `Error: ${seedResult.error}`}
          </p>
        )}
      </Card>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
          <LayoutDashboard size={32} className="text-akka-green" />
        </div>
        <p className="text-akka-text-secondary text-center">
          Full admin dashboard with charts and activity log.
        </p>
        <p className="text-sm text-akka-text-secondary mt-2">Coming in Phase 2</p>
      </div>
    </div>
  )
}
