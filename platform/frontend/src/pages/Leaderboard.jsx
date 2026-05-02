import { useState, useEffect } from 'react';
import { Trophy, Medal, Target } from 'lucide-react';
import { leaderboardAPI } from '../services/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const dbData = await leaderboardAPI.getLeaderboard();
        
        // 1. Calculate local points
        const localSubmissions = JSON.parse(localStorage.getItem('local_ctf_submissions') || '[]');
        const localPoints = localSubmissions.length * 10; // 10 points per flag
        const currentUsername = localStorage.getItem('username');
        
        // 2. Merge local points into DB data
        let userExistsInDb = false;
        const mergedData = dbData.map(user => {
          if (user.username === currentUsername) {
            userExistsInDb = true;
            return {
              ...user,
              total_score: (Number(user.total_score || user.score || 0) + localPoints).toString(),
              solved_count: (Number(user.solved_count || 0) + localSubmissions.length).toString()
            };
          }
          return user;
        });
        
        // 3. If user only solved local challenges (not in DB yet)
        if (!userExistsInDb && localPoints > 0 && currentUsername) {
          mergedData.push({
            username: currentUsername,
            total_score: localPoints.toString(),
            solved_count: localSubmissions.length.toString()
          });
        }
        
        // 4. Re-sort by total points descending
        mergedData.sort((a, b) => {
          const scoreA = Number(a.total_score || a.score || 0);
          const scoreB = Number(b.total_score || b.score || 0);
          return scoreB - scoreA;
        });
        
        // 5. Re-assign ranks
        const finalData = mergedData.map((user, index) => ({
          ...user,
          rank: index + 1
        }));
        
        setLeaderboard(finalData);
      } catch (error) {
        console.error("Failed to load leaderboard");
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
      <header className="page-header text-center w-full block mb-8">
        <h1 className="cyber-title lg justify-center flex items-center gap-3">
          <Target className="neon-text-blue" size={32} />
          GLOBAL_RANKINGS
        </h1>
        <p className="cyber-subtitle mt-2 text-dim">Top performers in the current cycle</p>
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
                <th>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user) => (
                <tr key={user.rank} className={user.rank <= 3 ? 'top-tier' : ''}>
                  <td className="rank-cell">
                    {getRankIcon(user.rank)}
                  </td>
                  <td className="user-cell">
                    <span className="username">{user.username}</span>
                    {user.username === localStorage.getItem('username') && <span className="you-badge">YOU</span>}
                  </td>
                  <td className="points-cell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span>{user.total_score || user.score || 0} PTS</span>
                    { (user.solved_count !== undefined) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>
                        ({user.solved_count} {Number(user.solved_count) === 1 ? 'solve' : 'solves'})
                      </span>
                    )}
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
