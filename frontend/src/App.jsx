import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import UrgePage from './pages/UrgePage'
import SOSPage from './pages/SOSPage'
import MorningRitual from './pages/MorningRitual'
import NightReflection from './pages/NightReflection'
import FutureMessage from './pages/FutureMessage'
import InsightsPage from './pages/InsightsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import HabitsPage from './pages/HabitsPage'
import JournalPage from './pages/JournalPage'
import AchievementsPage from './pages/AchievementsPage'
import BreathingPage from './pages/BreathingPage'
import ProfilePage from './pages/ProfilePage'
import QuotesPage from './pages/QuotesPage'
import AffirmationsPage from './pages/AffirmationsPage'
import SleepPage from './pages/SleepPage'
import WeeklyReportPage from './pages/WeeklyReportPage'
import SettingsPage from './pages/SettingsPage'
import TimelinePage from './pages/TimelinePage'
import NavLayout from './components/NavLayout'
import LoadingScreen from './components/LoadingScreen'
import MilestoneCelebration from './components/MilestoneCelebration'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Routes><Route path="*" element={<AuthPage />} /></Routes>
  return (
    <>
      <MilestoneCelebration />
      <Routes>
        <Route element={<NavLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/message" element={<FutureMessage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/affirmations" element={<AffirmationsPage />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/report" element={<WeeklyReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
        </Route>
        <Route path="/urge" element={<UrgePage />} />
        <Route path="/sos" element={<SOSPage />} />
        <Route path="/morning" element={<MorningRitual />} />
        <Route path="/night" element={<NightReflection />} />
        <Route path="/breathing" element={<BreathingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
