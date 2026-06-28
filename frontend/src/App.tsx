import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import Graph from './pages/Graph';
import Folders from './pages/Folders';
import Graphs from './pages/Graphs';
import RecentNotes from './pages/RecentNotes';
import ProtectedRoute from './components/ProtectedRoute';
import { useInitApp } from './hooks/useInitApp';
import { useTheme } from './hooks/useTheme';

function App() {
  useTheme();
  useInitApp();
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:id" element={<NoteDetail />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/folders" element={<Folders />} />
          <Route path="/graphs" element={<Graphs />} />
          <Route path="/recent" element={<RecentNotes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
