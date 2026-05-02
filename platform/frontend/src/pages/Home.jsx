import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Cpu, Play, StopCircle, Flag } from 'lucide-react';
import { containerAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Home = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [activeContainer, setActiveContainer] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleStartChallenge = async () => {
    setIsStarting(true);
    try {
      const res = await containerAPI.start();
      
      setActiveContainer({
        id: res.containerId,
        url: res.url,
        expiresAt: res.expiresAt
      });
      
      addToast(res.message || 'Challenge started successfully', 'success');
      
      // Open DVWA in new tab
      if (res.url) {
        window.open(res.url, "_blank");
      }
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes("active container")) {
        addToast("You already have an active container running!", "error");
      } else {
        addToast(errorMsg, "error");
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
        <h1 className="cyber-title lg">CTF Dashboard</h1>
        <div className="stats-panel glass-panel">
          <div className="stat-item">
            <span className="stat-label">STATUS:</span>
            <span className="stat-value neon-text-blue">ONLINE</span>
          </div>
        </div>
      </header>

      <div className="challenges-grid">
        
        {/* SQL INJECTION CHALLENGE CARD */}
        <div className="glass-panel challenge-card available">
          <div className="card-header">
            <h2 className="challenge-title">SQL Injection Challenge</h2>
            <span className="status-badge available"><ShieldAlert size={14} /> ACTIVE</span>
          </div>
          
          <p className="challenge-desc">
            Exploit SQL Injection vulnerability to retrieve the flag. A dedicated DVWA instance will be spun up just for you.
          </p>
          
          <div className="card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            
            <button 
              onClick={handleStartChallenge}
              className="cyber-btn primary-btn"
              disabled={isStarting}
            >
              {isStarting ? <Cpu className="spin" size={18} /> : <Play size={18} />}
              {isStarting ? 'INITIALIZING...' : 'START CHALLENGE'}
            </button>
            
            {activeContainer && (
              <button 
                onClick={() => window.open(activeContainer.url, "_blank")}
                className="cyber-btn secondary-btn"
              >
                OPEN TARGET
              </button>
            )}

            <button 
              onClick={() => navigate('/submit/1')}
              className="cyber-btn secondary-btn"
              style={{ borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}
            >
              <Flag size={18} />
              SUBMIT FLAG
            </button>

            {activeContainer && (
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
          
          <div className="card-glitch-layer"></div>
        </div>

        {/* CTF BOX CHALLENGE CARD (LOCAL) */}
        <div className="glass-panel challenge-card available">
          <div className="card-header">
            <h2 className="challenge-title">CTF Box</h2>
            <span className="status-badge available"><ShieldAlert size={14} /> ACTIVE</span>
          </div>
          
          <p className="challenge-desc">
            Multi-flag challenge (3 flags). All tracking happens locally to bypass the remote server.
          </p>
          
          <div className="card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            
            <button 
              onClick={() => {
                // Save flags locally in browser's "JSON" storage
                localStorage.setItem('local_ctf_flags', JSON.stringify([
                  'hackme{script_kidde}',
                  'hackme{gud_ol_eval}',
                  'hackme{find_da_exploit}'
                ]));
                if (!localStorage.getItem('local_ctf_submissions')) {
                  localStorage.setItem('local_ctf_submissions', JSON.stringify([]));
                }
                addToast('Local CTF tracking initialized', 'success');
                window.open("http://16.16.253.244/", "_blank");
              }}
              className="cyber-btn primary-btn"
            >
              <Play size={18} />
              START CHALLENGE
            </button>
            
            <button 
              onClick={() => navigate('/submit/2')}
              className="cyber-btn secondary-btn"
              style={{ borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}
            >
              <Flag size={18} />
              SUBMIT FLAG
            </button>

            <button 
              onClick={() => {
                const submissions = localStorage.getItem('local_ctf_submissions') || '[]';
                const blob = new Blob([submissions], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ctf_box_submissions.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addToast('JSON log downloaded!', 'success');
              }}
              className="cyber-btn secondary-btn"
              style={{ borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)', marginLeft: 'auto' }}
            >
              DOWNLOAD JSON LOG
            </button>
          </div>
          <div className="card-glitch-layer"></div>
        </div>
        
      </div>
    </div>
  );
};

export default Home;
