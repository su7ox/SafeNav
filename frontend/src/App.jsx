import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Activity, Lock, Sun, Moon, LogOut, CheckCircle, XCircle 
} from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:8000/api/v1';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('safenav_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('safenav_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('safenav_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('safenav_theme', 'light');
    }
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('safenav_token', newToken);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('safenav_token');
  };

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-content">
          <div className="nav-logo"><ShieldCheck /><span className="logo-text">SafeNav</span></div>
          <div className="nav-actions">
            <button className="icon-button" onClick={toggleDarkMode}>{darkMode ? <Sun /> : <Moon />}</button>
            {token ? (
              <button className="icon-button" onClick={handleLogout}><LogOut /></button>
            ) : (
              <button className="login-btn-nav" onClick={() => setShowAuthModal(true)}>Login</button>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <ScannerView token={token} onRequestLogin={() => setShowAuthModal(true)} />
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
    </div>
  );
};

// --- RESULT CARD COMPONENT ---
const DetailCard = ({ title, icon, data }) => (
  <div className="detail-card">
    <div className="detail-header">
      <span className="detail-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <div className="detail-content">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="detail-row">
          <span className="detail-label">{key.replace(/_/g, ' ')}:</span>
          <span className={`detail-value ${value === 'Yes' || value === 'Unsafe' || value === 'Expired' ? 'danger' : ''}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ScannerView = ({ token, onRequestLogin }) => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);

    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(`${API_URL}/scan`, { url }, config);
      setResult(response.data);
    } catch (err) {
      alert("Scan failed. Ensure backend is running.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="hero-section"><h1 className="hero-title">Scan links. Reveal hidden risks.</h1></div>
      
      <div className="search-container">
        <form onSubmit={handleScan} className="search-form">
          <Globe className="search-icon" />
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste URL here..." className="search-input" />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? <Loader2 className="spinner" /> : 'ANALYZE'}
          </button>
        </form>
      </div>

      {result && (
        <div className="result-container">
          
          {/* --- UPDATED VERDICT HEADER --- */}
         {/* Inside ScannerView component */}
<div className="result-card main-verdict">
   <div className="result-header">
      
      {/* LEFT SIDE GROUP */}
      <div className="header-left">
          <div className={`verdict-icon ${result.risk_score > 50 ? 'danger' : 'safe'}`}>
             {result.risk_score > 50 ? <XOctagon /> : <ShieldCheck />}
          </div>
          <div className="verdict-text-group">
             <h2 className={result.risk_score > 50 ? 'danger' : 'safe'}>{result.verdict}</h2>
             <p className="target-url">Target: {result.url}</p>
          </div>
      </div>

      {/* RIGHT SIDE GROUP */}
      <div className="risk-score-display">
          <div className="risk-score-number">{result.risk_score}</div>
          <div className="risk-score-label">RISK SCORE</div>
      </div>

   </div>
</div>
          <br />
          {/* AI INSIGHT (Middle) */}
          <div className="ai-insight">
             <div className="ai-insight-header"><Activity /><h3>AI Security Insight</h3></div>
             <div className="ai-insight-content">
                {result.is_guest ? (
                  <div className="locked-feature"><Lock size={16} /> Login to view AI Analysis</div>
                ) : (
                  result.reasoning.map((r, i) => <p key={i}>• {r}</p>)
                )}
             </div>
          </div>

          {/* 6-SECTION GRID */}
          <div className="grid-6-layout">
            <DetailCard title="SSL & Security" icon="🔐" data={result.details.ssl_security} />
            <DetailCard title="Phishing Checks" icon="🎣" data={result.details.phishing_checks} />
            <DetailCard title="Domain Reputation" icon="🌐" data={result.details.domain_reputation} />
            <DetailCard title="Link Structure" icon="🔗" data={result.details.link_structure} />
            <DetailCard title="Redirect Analysis" icon="🔄" data={result.details.redirect_analysis} />
            <DetailCard title="Content Safety" icon="🧾" data={result.details.content_safety} />
          </div>
          
          {/* DEEP SCAN BUTTON */}
          <button className={`deep-scan-button ${!token ? 'locked' : ''}`} onClick={() => token ? alert('Scanning...') : onRequestLogin()}>
             {token ? "Initialize Deep Scan" : "Login for Deep Scan"}
          </button>
        </div>
      )}
    </div>
  );
};

const AuthModal = ({ onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/register`, { email, password });
        alert("Registered!"); setIsRegister(false);
      } else {
        const fd = new FormData(); fd.append('username', email); fd.append('password', password);
        const res = await axios.post(`${API_URL}/login`, fd);
        onLogin(res.data.access_token);
      }
    } catch { alert("Auth Failed"); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="auth-submit-btn">Submit</button>
        </form>
        <p className="auth-switch" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Have account? Login" : "No account? Register"}
        </p>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default App;