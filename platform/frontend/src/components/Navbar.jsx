import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Trophy, LogOut, Home } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
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
          <span className="logo-text">CTF<span className="neon-text-green">_PLATFORM</span></span>
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
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
