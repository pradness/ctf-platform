import { useState, useEffect } from 'react';
import { Trophy, Medal, Target, Terminal } from 'lucide-react';
import { leaderboardAPI } from '../services/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const dbData = await leaderboardAPI.getLeaderboard();
        setLeaderboard(dbData);
      } catch (error) {
        console.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={20} className="gold" />;
    if (rank === 2) return <Medal size={20} className="silver" />;
    if (rank === 3) return <Medal size={20} className="bronze" />;
    return <span className="rank-number">{rank}</span>;
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header leaderboard-header">
        <div>
          <div className="terminal-badge mb-4">
            <Terminal size={14} />
            RANKING
          </div>
          <h1 className="cyber-title lg" data-glitch="GLOBAL_RANKINGS">
            <Target className="neon-text-blue" size={30} />
            GLOBAL_RANKINGS
          </h1>
          <p className="cyber-subtitle">Top performers in the current cycle.</p>
        </div>
        <div className="stats-panel glass-panel leaderboard-stats">
          <div className="stat-item">
            <span className="stat-label">BOARD:</span>
            <span className="stat-value neon-text-green">LIVE</span>
          </div>
        </div>
      </header>

      <div className="glass-panel leaderboard-panel">
        {loading ? (
          <div className="p-8 text-center neon-text-green">FETCHING_DATA...</div>
        ) : (
          <table className="cyber-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>OPERATIVE</th>
                <th style={{ textAlign: 'right' }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={user.rank || index} className={(user.rank || index + 1) <= 3 ? 'top-tier' : ''}>
                  <td className="rank-cell">
                    {getRankIcon(user.rank || index + 1)}
                  </td>
                  <td className="user-cell">
                    <span className="username">{user.username}</span>
                    {user.username === localStorage.getItem('username') && <span className="you-badge">YOU</span>}
                  </td>
                  <td className="points-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span className="score-value">{user.total_score || user.score || user.points || 0} PTS</span>
                      {user.solved_count !== undefined && (
                        <span className="solved-count" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>
                          ({user.solved_count} {Number(user.solved_count) === 1 ? 'solve' : 'solves'})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
