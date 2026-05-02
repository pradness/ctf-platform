import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Submit from './pages/Submit';
import { ToastProvider } from './components/Toast';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <ToastProvider>
      <div className="app-container">
        {!isLoginPage && <Navbar />}
        <main className={!isLoginPage ? 'main-content' : ''}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/submit/:challengeId" element={<ProtectedRoute><Submit /></ProtectedRoute>} />
            <Route path="/submit" element={<ProtectedRoute><Submit /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
