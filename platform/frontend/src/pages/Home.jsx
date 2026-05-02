import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, LockKeyhole, Cpu } from 'lucide-react';
import { challengesAPI } from '../services/api';

const Home = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await challengesAPI.getChallenges();
        // Check local storage for solved ones to update status (mocking persistence)
        const solved = JSON.parse(localStorage.getItem('solvedChallenges') || '[]');
        const updatedData = data.map(c => 
          solved.includes(c.id) ? { ...c, status: 'solved' } : c
        );
        setChallenges(updatedData);
      } catch (error) {
        console.error("Failed to load challenges");
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'solved':
        return <span className="status-badge solved"><CheckCircle2 size={14} /> SOLVED</span>;
      case 'locked':
        return <span className="status-badge locked"><LockKeyhole size={14} /> LOCKED</span>;
      default:
        return <span className="status-badge available"><ShieldAlert size={14} /> AVAILABLE</span>;
    }
  };

  if (loading) {
    return <div className="loading-screen"><Cpu className="spin neon-text-green" size={48} /><span>LOADING_MODULES...</span></div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <h1 className="cyber-title lg">CTF Dashboard</h1>
        <div className="stats-panel glass-panel">
          <div className="stat-item">
            <span className="stat-label">USER:</span>
            <span className="stat-value neon-text-blue">admin</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">POINTS:</span>
            <span className="stat-value neon-text-green">300</span>
          </div>
        </div>
      </header>

      <div className="challenges-grid">
        {challenges.map((challenge) => (
          <div key={challenge.id} className={`glass-panel challenge-card ${challenge.status}`}>
            <div className="card-header">
              <h2 className="challenge-title">{challenge.title}</h2>
              {getStatusBadge(challenge.status)}
            </div>
            
            <p className="challenge-desc">{challenge.description}</p>
            
            <div className="card-footer">
              <span className="points-badge">{challenge.points} PTS</span>
              <button 
                onClick={() => navigate(`/challenge/${challenge.id}`)}
                className="cyber-btn secondary-btn"
                disabled={challenge.status === 'locked'}
              >
                {challenge.status === 'solved' ? 'REVIEW' : 'ATTEMPT'}
              </button>
            </div>
            
            <div className="card-glitch-layer"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
