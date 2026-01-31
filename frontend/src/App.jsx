import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Activity, History, LogOut, Moon, Sun, User, Lock 
} from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:8000/api/v1';

const App = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [recentScans, setRecentScans] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('safenav_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('safenav_history');
    if (saved) setRecentScans(JSON.parse(saved));
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
          <div className="nav-logo">
            <div className="logo-icon"><ShieldCheck /></div>
            <span className="logo-text">SafeNav</span>
          </div>
          <div className="nav-actions">
            <button className="icon-button" onClick={toggleDarkMode}>
              {darkMode ? <Sun /> : <Moon />}
            </button>
            {token ? (
              <button className="icon-button" onClick={handleLogout} title="Logout">
                <LogOut />
              </button>
            ) : (
              <button className="login-btn-nav" onClick={() => setShowAuthModal(true)}>
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <ScannerView 
          token={token} 
          onScanComplete={() => {}} 
          onRequestLogin={() => setShowAuthModal(true)}
        />
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />}
    </div>
  );
};

const ScannerView = ({ token, onScanComplete, onRequestLogin }) => {
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
      onScanComplete(response.data);
    } catch (err) {
      console.error(err);
      alert("Scan failed. Ensure Backend is running.");
    }
    setLoading(false);
  };

  const handleDeepScan = async () => {
    if (!token) {
      onRequestLogin();
      return;
    }
    alert("Deep Scan Initiated (Demo)");
  };

  return (
    <div>
      <div className="hero-section">
        <h1 className="hero-title">Scan links. Reveal hidden risks.</h1>
      </div>

      <div className="search-container">
        <form onSubmit={handleScan} className="search-form">
          <div className="search-icon"><Globe /></div>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL here..." 
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? <Loader2 className="spinner" /> : 'ANALYZE'}
          </button>
        </form>
      </div>

      {result && (
        <div className="result-container">
          <div className="result-card">
            <div className="result-header">
              <div className="result-info">
                 <div className={`verdict-icon ${result.risk_score > 50 ? 'danger' : 'safe'}`}>
                   <ShieldCheck />
                 </div>
                 <div className="verdict-details">
                   <h2 className={result.risk_score > 50 ? 'danger' : 'safe'}>{result.verdict}</h2>
                   <p className="target-url">Target: {result.url}</p>
                 </div>
              </div>
              <div className="risk-score-display">
                <div className="risk-score-number">{result.risk_score}</div>
              </div>
            </div>

            <div className="ai-insight">
              <div className="ai-insight-header">
                <Activity />
                <h3>AI Security Insight</h3>
              </div>
              <div className="ai-insight-content">
                {result.is_guest ? (
                  <div className="locked-feature">
                    <Lock size={16} />
                    <span>Advanced AI Analysis is locked. <button className="text-link" onClick={onRequestLogin}>Login</button> to view details.</span>
                  </div>
                ) : (
                  result.reasoning.map((r, i) => <p key={i}>• {r}</p>)
                )}
              </div>
            </div>

            <div className="details-grid">
              {/* Threat Indicators */}
              <div className="details-section">
                <h3>Threat Indicators</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Suspicious TLD:</span>
                    <span className={`detail-value ${result.details.suspicious_tld ? 'danger' : 'safe'}`}>
                      {result.details.suspicious_tld ? 'Detected' : 'Clean'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Typosquatting:</span>
                    <span className={`detail-value ${result.details.typosquatting ? 'danger' : 'safe'}`}>
                      {result.details.typosquatting ? 'Match Found' : 'None Detected'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Insecure Form:</span>
                    <span className={`detail-value ${result.details.insecure_login ? 'danger' : 'safe'}`}>
                      {result.details.insecure_login ? 'Detected' : 'Safe'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Redirect Hops:</span>
                    <span className="detail-value">{result.details.hop_count}</span>
                  </div>
                </div>
              </div>

              {/* Technical Footprint - EXPANDED */}
              <div className="details-section">
                <h3>Technical Footprint</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Link Category:</span>
                    <span className="detail-value">{result.details.link_category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">SSL Issuer:</span>
                    <span className="detail-value" title={result.details.ssl_issuer}>
                      {result.details.ssl_issuer ? (result.details.ssl_issuer.length > 20 ? result.details.ssl_issuer.substring(0,20)+'...' : result.details.ssl_issuer) : 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Validation Type:</span>
                    <span className="detail-value">{result.details.ssl_type || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Cert Validity:</span>
                    <span className="detail-value">{result.details.cert_age_days !== null ? `${result.details.cert_age_days} Days` : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Destination:</span>
                    <span className="detail-value" title={result.details.final_destination}>
                      {result.details.final_destination ? result.details.final_destination.substring(0,25)+'...' : 'Same'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button className={`deep-scan-button ${!token ? 'locked' : ''}`} onClick={handleDeepScan}>
              {!token && <Lock size={16} style={{marginRight: '8px', display:'inline'}} />}
              {token ? "Initialize Deep Scan Analysis" : "Login for Deep Scan Analysis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthModal = ({ onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/register`, { email, password });
        setIsRegister(false);
        alert("Registered! Please login.");
      } else {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const res = await axios.post(`${API_URL}/login`, formData);
        onLogin(res.data.access_token);
      }
    } catch (err) {
      setError("Authentication failed. Check credentials.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="auth-submit-btn">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "No account?"}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? " Login" : " Register"}
          </span>
        </p>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default App;