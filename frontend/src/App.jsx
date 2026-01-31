import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Activity, History, Trash2, Moon, Sun, User, Lock, LogOut
} from 'lucide-react';
import './App.css';

// --- CONFIG ---
const API_URL = 'http://localhost:8000/api/v1';

const App = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [recentScans, setRecentScans] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('safenav_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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

  const handleLogin = (newToken, email) => {
    setToken(newToken);
    setUserEmail(email);
    localStorage.setItem('safenav_token', newToken);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail('');
    localStorage.removeItem('safenav_token');
  };

  return (
    <div className="app-container">
      {/* Navigation */}
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

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'scan' ? (
          <ScannerView 
            token={token} 
            onScanComplete={(res) => {
              // Simple history update logic
            }} 
            onRequestLogin={() => setShowAuthModal(true)}
          />
        ) : (
          <div />
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin} 
        />
      )}
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
      // Send Token if available
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.post(`${API_URL}/scan`, { url }, config);
      setResult(response.data);
      onScanComplete(response.data);
    } catch (err) {
      console.error(err);
      alert("Scan failed. Is backend running?");
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
            {/* Verdict Header */}
            <div className="result-header">
              <div className="result-info">
                 <div className={`verdict-icon ${result.risk_score > 50 ? 'danger' : 'safe'}`}>
                   <ShieldCheck />
                 </div>
                 <div className="verdict-details">
                   <h2>{result.verdict}</h2>
                   <p className="target-url">Target: {result.url}</p>
                 </div>
              </div>
              <div className="risk-score-display">
                <div className="risk-score-number">{result.risk_score}</div>
              </div>
            </div>

            {/* AI Insight - GATED */}
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

            {/* Deep Scan Button - GATED */}
            <button 
              className={`deep-scan-button ${!token ? 'locked' : ''}`} 
              onClick={handleDeepScan}
            >
              {!token && <Lock size={16} style={{marginRight: '8px', display:'inline'}} />}
              {token ? "Initialize Deep Scan Analysis" : "Login for Deep Scan Analysis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Auth Modal Component
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
        // Auto switch to login after register
        setIsRegister(false);
        alert("Registered! Please login.");
      } else {
        // Login needs form-data format for OAuth2
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const res = await axios.post(`${API_URL}/login`, formData);
        onLogin(res.data.access_token, email);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input 
            type="email" placeholder="Email" required 
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required 
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" className="auth-submit-btn">
            {isRegister ? 'Register' : 'Login'}
          </button>
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