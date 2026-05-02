import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Lock, User, ChevronRight } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await authAPI.login(username, password);
      localStorage.setItem('token', res.token);
      addToast('Access Granted', 'success');
      setTimeout(() => navigate('/home'), 500);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="matrix-bg"></div>
      <div className="glass-panel login-panel">
        <div className="login-header">
          <Terminal size={48} className="neon-text-green mb-4 mx-auto" />
          <h1 className="cyber-title">SYSTEM_LOGIN</h1>
          <p className="cyber-subtitle">Enter credentials to access mainframe</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="cyber-input"
              required
            />
          </div>
          
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input"
              required
            />
          </div>

          <button type="submit" className="cyber-btn primary-btn w-full mt-4" disabled={isLoading}>
            {isLoading ? <span className="loading-pulse">AUTHENTICATING...</span> : (
              <>
                INITIALIZE_SESSION <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Demo credentials: <code>admin</code> / <code>admin</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
