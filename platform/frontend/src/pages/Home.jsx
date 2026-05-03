import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Cpu, Play, StopCircle, Flag, Terminal, Box, ArrowUpRight } from 'lucide-react';
import { containerAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Home = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [activeContainer, setActiveContainer] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleStartChallenge = async (challengeId) => {
    setIsStarting(true);
    try {
      const res = await containerAPI.start(challengeId);

      setActiveContainer({
        id: res.containerId,
        url: res.url,
        expiresAt: res.expiresAt,
        challengeId,
      });

      addToast(res.message || 'Challenge started successfully', 'success');

      if (res.url) {
        window.open(res.url, '_blank');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes('active container')) {
        addToast('You already have an active container running!', 'error');
      } else {
        addToast(errorMsg, 'error');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopChallenge = async () => {
    if (!activeContainer) return;

    setIsStopping(true);
    try {
      await containerAPI.stop(activeContainer.id);
      addToast('Container stopped successfully', 'success');
      setActiveContainer(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to stop container', 'error');
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <div>
          <div className="terminal-badge mb-4">
            <Terminal size={14} />
            DASHBOARD
          </div>
          <h1 className="cyber-title lg">CTF DASHBOARD</h1>
          <p className="cyber-subtitle">Launch targets, submit flags, and track progress from one shell.</p>
        </div>
        <div className="stats-panel glass-panel">
          <div className="stat-item">
            <span className="stat-label">STATUS:</span>
            <span className="stat-value neon-text-blue">ONLINE</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">MODE:</span>
            <span className="stat-value neon-text-green">CONTEST</span>
          </div>
        </div>
      </header>

      <div className="challenges-grid">
        <div className="glass-panel challenge-card available">
          <div className="card-header">
            <div>
              <p className="card-kicker">TARGET 01</p>
              <h2 className="challenge-title">SQL Injection Challenge</h2>
            </div>
            <span className="status-badge available"><ShieldAlert size={14} /> ACTIVE</span>
          </div>

          <p className="challenge-desc">
            Exploit the login flow, extract the hidden flag, and submit it from the terminal panel.
          </p>

          <div className="mini-terminal">
            <span className="prompt">root@ctf:~#</span> start target --sqli
          </div>

          <div className="card-footer">
            <button
              onClick={() => handleStartChallenge(1)}
              className="cyber-btn primary-btn"
              disabled={isStarting}
            >
              {isStarting ? <Cpu className="spin" size={18} /> : <Play size={18} />}
              {isStarting ? 'INITIALIZING...' : 'START CHALLENGE'}
            </button>

            {activeContainer?.challengeId === 1 && (
              <button
                onClick={() => window.open(activeContainer.url, '_blank')}
                className="cyber-btn secondary-btn"
              >
                <ArrowUpRight size={18} />
                OPEN TARGET
              </button>
            )}

            <button
              onClick={() => navigate('/submit/1')}
              className="cyber-btn secondary-btn"
            >
              <Flag size={18} />
              SUBMIT FLAG
            </button>

            {activeContainer?.challengeId === 1 && (
              <button
                onClick={handleStopChallenge}
                className="cyber-btn"
                style={{ borderColor: 'var(--neon-red)', color: 'var(--neon-red)', marginLeft: 'auto' }}
                disabled={isStopping}
              >
                <StopCircle size={18} />
                STOP
              </button>
            )}
          </div>
        </div>

        <div className="glass-panel challenge-card available">
          <div className="card-header">
            <div>
              <p className="card-kicker">TARGET 02</p>
              <h2 className="challenge-title">CTF Box</h2>
            </div>
            <span className="status-badge available"><ShieldAlert size={14} /> ACTIVE</span>
          </div>

          <p className="challenge-desc">
            Multi-flag challenge. Open the box, explore the host, and harvest every hidden flag.
          </p>

          <div className="mini-terminal">
            <span className="prompt">root@ctf:~#</span> ssh lab@external-box
          </div>

          <div className="card-footer">
            <button
              onClick={() => window.open('http://16.16.253.244/', '_blank')}
              className="cyber-btn primary-btn"
            >
              <Box size={18} />
              START CHALLENGE
            </button>

            <button
              onClick={() => navigate('/submit/2')}
              className="cyber-btn secondary-btn"
            >
              <Flag size={18} />
              SUBMIT FLAG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
