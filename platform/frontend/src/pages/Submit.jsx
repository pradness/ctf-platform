import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Flag, ArrowLeft } from 'lucide-react';
import { challengesAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Submit = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [flag, setFlag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flag.trim()) {
      addToast('Please enter a flag', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      // Challenge ID is implicitly 1 for the SQLi challenge as per requirements
      const res = await challengesAPI.submitFlag(1, flag);
      
      // Backend returns either { message: "Correct flag 🎉", points } 
      // or { message: "Wrong flag ❌" } / "Already solved ⚠️"
      if (res.message && res.message.includes("Correct")) {
        addToast('Correct Flag ✅', 'success');
        setTimeout(() => navigate('/home'), 1500);
      } else {
        addToast(res.message || 'Incorrect Flag ❌', 'error');
      }
      
      setFlag('');
    } catch (err) {
      addToast(err.response?.data?.message || err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <button onClick={() => navigate('/home')} className="back-btn mb-6">
        <ArrowLeft size={20} /> Return to Dashboard
      </button>

      <div className="glass-panel challenge-detail-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="challenge-header justify-center">
          <Terminal size={32} className="neon-text-green" />
          <h1 className="cyber-title">SUBMIT FLAG</h1>
        </div>

        <div className="flag-submission-area mt-4">
          <p className="submit-desc text-center mb-6">Submit the flag you extracted from the target environment.</p>
          <form onSubmit={handleSubmit} className="flag-form" style={{ flexDirection: 'column' }}>
            <div className="input-group w-full" style={{ marginBottom: '1.5rem' }}>
              <Flag className="input-icon" size={20} />
              <input
                type="text"
                placeholder="FLAG{...}"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                className="cyber-input"
                required
              />
            </div>
            <button type="submit" className="cyber-btn primary-btn w-full" disabled={submitting}>
              {submitting ? 'VERIFYING...' : 'SUBMIT FLAG'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Submit;
