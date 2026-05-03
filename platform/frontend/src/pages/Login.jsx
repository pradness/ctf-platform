import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Lock, User, ChevronRight } from 'lucide-react';
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
        setIsLogin(true); // switch to login mode
        setPassword(''); // clear password field
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
      <div className="glass-panel login-panel">
        <div className="login-header">
          <Terminal size={48} className="neon-text-green mb-4 mx-auto" />
          <h1 className="cyber-title">{isLogin ? 'SYSTEM_LOGIN' : 'NEW_OPERATIVE'}</h1>
          <p className="cyber-subtitle">
            {isLogin ? 'Enter credentials to access mainframe' : 'Register for CTF access'}
          </p>
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
            {isLoading ? <span className="loading-pulse">AUTHENTICATING...</span> : (
              <>
                {isLogin ? 'INITIALIZE_SESSION' : 'REGISTER_ACCOUNT'} <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already registered? "}
            <span 
              className="neon-text-blue" 
              style={{cursor: 'pointer', textDecoration: 'underline'}} 
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
              }}
            >
              {isLogin ? "Sign up" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
