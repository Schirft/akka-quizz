import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import PlayerLayout from './components/layout/PlayerLayout'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import HomePage from './pages/player/HomePage'
import QuizPage from './pages/player/QuizPage'
import NewsPage from './pages/player/NewsPage'
import ArticleDetailPage from './pages/player/ArticleDetailPage'
import QuizResultsPage from './pages/player/QuizResultsPage'
import DashboardPage from './pages/admin/DashboardPage'
import QuestionsPage from './pages/admin/QuestionsPage'
import GeneratePage from './pages/admin/GeneratePage'
import DailyQuizPage from './pages/admin/DailyQuizPage'
import AdminNewsPage from './pages/admin/AdminNewsPage'
import AdminPuzzlesPage from './pages/admin/AdminPuzzlesPage'
import AdminLessonsPage from './pages/admin/AdminLessonsPage'
import DailyChallengePage from './pages/player/DailyChallengePage'
import PuzzlePage from './pages/player/PuzzlePage'
import LessonPage from './pages/player/LessonPage'

/**
 * PlayerShell — centered mobile container for standalone player pages.
 */
function PlayerShell({ children }) {
  return (
    <div className="min-h-screen bg-[#E5E7EB]">
      <div className="max-w-md mx-auto min-h-screen shadow-xl relative">
        {children}
      </div>
    </div>
  )
}

/**
 * ProtectedRoute — redirects to /login if user is not authenticated.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-akka-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

/**
 * App — Main router for the Akka Quiz application.
 */
export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-akka-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public route */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <PlayerShell><LoginPage /></PlayerShell>}
      />

      {/* Player routes with TabBar */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PlayerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="news" element={<NewsPage />} />
      </Route>

      {/* Article detail route — no TabBar */}
      <Route
        path="/news/:id"
        element={
          <ProtectedRoute>
            <PlayerShell>
              <ArticleDetailPage />
            </PlayerShell>
          </ProtectedRoute>
        }
      />

      {/* Quiz route — no TabBar */}
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <PlayerShell>
              <QuizPage />
            </PlayerShell>
          </ProtectedRoute>
        }
      />

      {/* Quiz results route — no TabBar */}
      <Route
        path="/quiz/results"
        element={
          <ProtectedRoute>
            <PlayerShell>
              <QuizResultsPage />
            </PlayerShell>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="generate" element={<GeneratePage />} />
        <Route path="daily" element={<DailyQuizPage />} />
        <Route path="news" element={<AdminNewsPage />} />
        <Route path="puzzles" element={<AdminPuzzlesPage />} />
        <Route path="lessons" element={<AdminLessonsPage />} />
      </Route>

      {/* Daily Challenge flow — no TabBar */}
      <Route
        path="/challenge"
        element={
          <ProtectedRoute>
            <PlayerShell>
              <DailyChallengePage />
            </PlayerShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/puzzle"
        element={
          <ProtectedRoute>
            <PlayerShell>
              <PuzzlePage />
            </PlayerShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lesson"
        element={
          <ProtectedRoute>
            <PlayerShell>
              <LessonPage />
            </PlayerShell>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

