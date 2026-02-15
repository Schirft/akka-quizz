import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import PlayerLayout from './components/layout/PlayerLayout'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import HomePage from './pages/player/HomePage'
import QuizPage from './pages/player/QuizPage'
import NewsPage from './pages/player/NewsPage'
import LeaderboardPage from './pages/player/LeaderboardPage'
import ProfilePage from './pages/player/ProfilePage'
import QuizResultsPage from './pages/player/QuizResultsPage'
import DashboardPage from './pages/admin/DashboardPage'

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
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
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
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Quiz route — no TabBar */}
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        }
      />

      {/* Quiz results route — no TabBar */}
      <Route
        path="/quiz/results"
        element={
          <ProtectedRoute>
            <QuizResultsPage />
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
        <Route path="questions" element={<PlaceholderAdmin title="Questions Manager" />} />
        <Route path="generate" element={<PlaceholderAdmin title="AI Generator" />} />
        <Route path="review" element={<PlaceholderAdmin title="AI Review" />} />
        <Route path="daily-quiz" element={<PlaceholderAdmin title="Daily Quiz" />} />
        <Route path="import" element={<PlaceholderAdmin title="Import / Export" />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/**
 * Inline placeholder for admin sub-pages.
 */
function PlaceholderAdmin({ title }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold text-akka-text">{title}</h1>
      <p className="mt-2 text-akka-text-secondary">Coming in Phase 2</p>
    </div>
  )
}
