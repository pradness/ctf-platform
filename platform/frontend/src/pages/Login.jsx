import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Lock, User, ChevronRight, Shield } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await authAPI.login(username, password);
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', username);
        addToast('Access Granted', 'success');
        setTimeout(() => navigate('/home'), 500);
      } else {
        const res = await authAPI.signup(username, password);
        addToast(res.message || 'Signup successful. Please login.', 'success');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="matrix-bg"></div>
      <div className="glass-panel login-panel terminal-card">
        <div className="login-header">
          <div className="terminal-badge">
            <Shield size={14} />
            ACCESS GATE
          </div>
          <Terminal size={42} className="neon-text-green mx-auto mt-4" />
          <h1 className="cyber-title" data-glitch="CTF ENTER">CTF ENTER</h1>
          <p className="cyber-subtitle">
            {isLogin ? 'authenticate to reach the dashboard' : 'claim an account for the arena'}
          </p>
        </div>

        <div className="terminal-strip">
          <span>root@ctf:~#</span>
          <span>session ready</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
            {isLoading ? <span className="loading-pulse">PROCESSING...</span> : (
              <>
                {isLogin ? 'INITIALIZE_SESSION' : 'REGISTER_ACCOUNT'} <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? 'No account yet? ' : 'Already registered? '}
            <span
              className="neon-text-blue"
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
              }}
            >
              {isLogin ? 'Switch to signup' : 'Switch to login'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
