import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppState } from './store';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import JoinQuiz from './pages/JoinQuiz';
import PlayerDashboard from './pages/player/PlayerDashboard';
import Lobby from './pages/player/Lobby';
import QuestionScreen from './pages/player/QuestionScreen';
import Results from './pages/player/Results';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateQuiz from './pages/organizer/CreateQuiz';
import QuizEditor from './pages/organizer/QuizEditor';
import HostRoom from './pages/organizer/HostRoom';
import { type ReactNode } from 'react';

function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'player' | 'organizer' }) {
  const { state } = useAppState();
  if (!state.authReady) return null;
  if (!state.user) return <Navigate to="/login" replace />;
  if (role && state.user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join" element={
          <ProtectedRoute role="player"><JoinQuiz /></ProtectedRoute>
        } />

        {/* Player */}
        <Route path="/player" element={
          <ProtectedRoute role="player"><PlayerDashboard /></ProtectedRoute>
        } />
        <Route path="/play/lobby" element={
          <ProtectedRoute role="player"><Lobby /></ProtectedRoute>
        } />
        <Route path="/play/question" element={
          <ProtectedRoute role="player"><QuestionScreen /></ProtectedRoute>
        } />
        <Route path="/play/results" element={
          <ProtectedRoute role="player"><Results /></ProtectedRoute>
        } />

        {/* Organizer */}
        <Route path="/organizer" element={
          <ProtectedRoute role="organizer"><OrganizerDashboard /></ProtectedRoute>
        } />
        <Route path="/organizer/create" element={
          <ProtectedRoute role="organizer"><CreateQuiz /></ProtectedRoute>
        } />
        <Route path="/organizer/edit/:quizId" element={
          <ProtectedRoute role="organizer"><QuizEditor /></ProtectedRoute>
        } />
        <Route path="/organizer/host/:quizId" element={
          <ProtectedRoute role="organizer"><HostRoom /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
