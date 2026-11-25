
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Cpu,
  Play,
  Flag,
  Terminal,
  Box,
  ArrowUpRight,
} from 'lucide-react';
import { challengesAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Home = () => {
  const [isStarting, setIsStarting] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [activeBoxChallenge, setActiveBoxChallenge] = useState(null);

  const navigate = useNavigate();
  const { addToast } = useToast();

  const getChallengesList = async () => {
    const response = await challengesAPI.getChallenges();

    const challenges = Array.isArray(response)
      ? response
      : response?.challenges || response?.data || [];

    return Array.isArray(challenges) ? challenges : [];
  };

  const getSqlInjectionChallenge = async () => {
    const challenges = await getChallengesList();

    const challenge = challenges.find(
      (item) =>
        item.name?.toLowerCase() === 'custom sql injection' ||
        item.name?.toLowerCase() === 'sql injection'
    );

    if (!challenge || !challenge.url) {
      throw new Error('SQL Injection challenge URL not found');
    }

    return challenge;
  };

  const getCTFBoxChallenge = async () => {
    const challenges = await getChallengesList();

    const challenge = challenges.find(
      (item) => item.name?.toLowerCase() === 'ctf box'
    );

    if (!challenge || !challenge.url) {
      throw new Error('CTF Box challenge URL not found');
    }

    return challenge;
  };

  const handleStartChallenge = async () => {
    setIsStarting(true);

    const newTab = window.open('about:blank', '_blank');

    if (!newTab) {
      addToast('Please allow popups for this website', 'error');
      setIsStarting(false);
      return;
    }

    newTab.opener = null;

    try {
      const challenge = await getSqlInjectionChallenge();

      newTab.location.href = challenge.url;

      setActiveChallenge(challenge);

      addToast('Challenge opened successfully', 'success');
    } catch (err) {
      newTab.close();

      addToast(
        err.response?.data?.message || err.message,
        'error'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmitFlag = async () => {
    try {
      const challenge =
        activeChallenge || await getSqlInjectionChallenge();

      navigate(`/submit/${challenge.id}`);
    } catch (err) {
      addToast(
        err.response?.data?.message || err.message,
        'error'
      );
    }
  };

  const handleStartCTFBox = async () => {
    const newTab = window.open('about:blank', '_blank');

    if (!newTab) {
      addToast('Please allow popups for this website', 'error');
      return;
    }

    newTab.opener = null;

    try {
      const challenge = await getCTFBoxChallenge();

      newTab.location.href = challenge.url;

      setActiveBoxChallenge(challenge);

      addToast('CTF Box opened successfully', 'success');
    } catch (err) {
      newTab.close();

      addToast(
        err.response?.data?.message || err.message,
        'error'
      );
    }
  };

  const handleSubmitBoxFlag = async () => {
    try {
      const challenge =
        activeBoxChallenge || await getCTFBoxChallenge();

      navigate(`/submit/${challenge.id}`);
    } catch (err) {
      addToast(
        err.response?.data?.message || err.message,
        'error'
      );
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

          <h1
            className="cyber-title lg"
            data-glitch="CTF DASHBOARD"
          >
            CTF DASHBOARD
          </h1>

          <p className="cyber-subtitle">
            Launch targets, submit flags, and track progress from one shell.
          </p>
        </div>

        <div className="stats-panel glass-panel">
          <div className="stat-item">
            <span className="stat-label">STATUS:</span>
            <span className="stat-value neon-text-blue">
              ONLINE
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">MODE:</span>
            <span className="stat-value neon-text-green">
              CONTEST
            </span>
          </div>
        </div>
      </header>

      <div className="challenges-grid">
        <div className="glass-panel challenge-card available">
          <div className="card-header">
            <div>
              <p className="card-kicker">TARGET 01</p>
              <h2 className="challenge-title">
                SQL Injection Challenge
              </h2>
            </div>

            <span className="status-badge available">
              <ShieldAlert size={14} />
              ACTIVE
            </span>
          </div>

          <p className="challenge-desc">
            Exploit the login flow, extract the hidden flag,
            and submit it from the terminal panel.
          </p>

          <div className="mini-terminal">
            <span className="prompt">root@ctf:~#</span>{' '}
            start target --sqli
          </div>

          <div className="card-footer">
            <button
              onClick={handleStartChallenge}
              className="cyber-btn primary-btn"
              disabled={isStarting}
            >
              {isStarting ? (
                <Cpu className="spin" size={18} />
              ) : (
                <Play size={18} />
              )}

              {isStarting
                ? 'INITIALIZING...'
                : 'START CHALLENGE'}
            </button>

            {activeChallenge && (
              <button
                onClick={() =>
                  window.open(
                    activeChallenge.url,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
                className="cyber-btn secondary-btn"
              >
                <ArrowUpRight size={18} />
                OPEN TARGET
              </button>
            )}

            <button
              onClick={handleSubmitFlag}
              className="cyber-btn secondary-btn"
            >
              <Flag size={18} />
              SUBMIT FLAG
            </button>
          </div>
        </div>

        <div className="glass-panel challenge-card available">
          <div className="card-header">
            <div>
              <p className="card-kicker">TARGET 02</p>
              <h2 className="challenge-title">
                CTF Box
              </h2>
            </div>

            <span className="status-badge available">
              <ShieldAlert size={14} />
              ACTIVE
            </span>
          </div>

          <p className="challenge-desc">
            Multi-flag challenge. Open the box, explore the
            host, and harvest every hidden flag.
          </p>

          <div className="mini-terminal">
            <span className="prompt">root@ctf:~#</span>{' '}
            ssh lab@external-box
          </div>

          <div className="card-footer">
            <button
              onClick={handleStartCTFBox}
              className="cyber-btn primary-btn"
            >
              <Box size={18} />
              START CHALLENGE
            </button>

            <button
              onClick={handleSubmitBoxFlag}
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
