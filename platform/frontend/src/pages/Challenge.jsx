import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal, Flag, ArrowLeft, ExternalLink } from 'lucide-react';
import { challengesAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Challenge = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [challengeInfo, setChallengeInfo] = useState(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      const data = await challengesAPI.getChallenges();
      const info = data.find(c => c.id === id);
      setChallengeInfo(info);
    };
    fetchChallenge();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await challengesAPI.submitFlag(id, flag);
      addToast(res.message, 'success');

      const solved = JSON.parse(localStorage.getItem('solvedChallenges') || '[]');
      if (!solved.includes(id)) {
        solved.push(id);
        localStorage.setItem('solvedChallenges', JSON.stringify(solved));
      }

      setFlag('');
      setTimeout(() => navigate('/home'), 1500);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!challengeInfo) return <div className="loading-screen">Loading Challenge Data...</div>;

  const isExternalChallenge = Boolean(challengeInfo.url);

  return (
    <div className="page-container animate-fade-in">
      <button onClick={() => navigate('/home')} className="back-btn mb-6">
        <ArrowLeft size={20} /> Return to Dashboard
      </button>

      <div className="glass-panel challenge-detail-panel">
        <div className="challenge-header">
          <Terminal size={32} className="neon-text-blue" />
          <h1 className="cyber-title" data-glitch={challengeInfo.title}>{challengeInfo.title}</h1>
          <span className="points-badge large">{challengeInfo.points} PTS</span>
        </div>

        <div className="challenge-content">
          <div className="terminal-window">
            <div className="terminal-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
              <span className="title">target_env.sh</span>
            </div>
            <div className="terminal-body">
              <p className="terminal-text"><span className="prompt">root@ctf:~#</span> cat mission.txt</p>
              <p className="terminal-text text-gray-300">{challengeInfo.description}</p>
              <p className="terminal-text"><span className="prompt">root@ctf:~#</span> ./start_target.sh</p>
              <p className="terminal-text text-green-400">Target initialized at virtual IP: 192.168.1.100</p>
              <p className="terminal-text"><span className="prompt blink">_</span></p>
            </div>
          </div>
        </div>

        {isExternalChallenge && (
          <div className="flag-submission-area">
            <h3 className="submit-title">Open Lab</h3>
            <p className="submit-desc">This challenge runs as a standalone app. Open it and solve it directly.</p>
            <div className="mini-terminal url-terminal">
              <span className="prompt">root@ctf:~#</span>
              <span>{challengeInfo.url}</span>
            </div>
            <a
              href={challengeInfo.url}
              target="_blank"
              rel="noreferrer"
              className="cyber-btn primary-btn inline-flex items-center justify-center"
            >
              <ExternalLink size={18} />
              Launch Custom SQLi
            </a>
          </div>
        )}

        {!isExternalChallenge && (
          <div className="flag-submission-area">
            <h3 className="submit-title">Submit Flag</h3>
            <p className="submit-desc">Try 'flag{'{'}hacker{'}'}' for demo purposes</p>
            <form onSubmit={handleSubmit} className="flag-form">
              <div className="input-group">
                <Flag className="input-icon" size={20} />
                <input
                  type="text"
                  placeholder="flag{...}"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className="cyber-input"
                  required
                />
              </div>
              <button type="submit" className="cyber-btn primary-btn" disabled={submitting}>
                {submitting ? 'VERIFYING...' : 'SUBMIT_FLAG'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenge;
