import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Trophy, LogOut, Home, User, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const username = localStorage.getItem('username') || 'OPERATIVE';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  const navLinks = [
    { path: '/home', label: 'Dashboard', icon: Home },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Terminal className="neon-text-green" size={28} />
          <div className="logo-copy">
            <span className="logo-text" data-glitch="CTF_PLATFORM">CTF<span className="neon-text-green">_PLATFORM</span></span>
            <span className="logo-subtitle">terminal operations</span>
          </div>
        </div>
        
        <div className="navbar-links">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link 
              key={path} 
              to={path} 
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          
          <div className="profile-container">
            <button 
              className={`nav-link profile-btn ${showProfile ? 'active' : ''}`}
              onClick={() => setShowProfile(!showProfile)}
            >
              <User size={18} />
              {username}
              <ChevronDown size={14} className={`arrow-icon ${showProfile ? 'rotate' : ''}`} />
            </button>
            
            {showProfile && (
              <div className="glass-panel profile-dropdown animate-slide-down">
                <div className="dropdown-user">
                  <span className="text-dim text-xs">LOGGED_IN_AS:</span>
                  <span className="username neon-text-blue">{username}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout-item">
                  <LogOut size={16} />
                  LOGOUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
