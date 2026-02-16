import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XCircle, Search, Lock, History, LogOut, User, Loader2, Menu,
  Globe, Sun, Moon, XOctagon, Activity 
} from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:8000/api/v1';

// --- ABOUT US PAGE ---
const AboutUs = () => (
  <div className="max-w-4xl mx-auto px-6 py-12 text-slate-300 animate-fade-in">
    <h1 className="text-4xl font-bold text-white mb-6">About <span className="text-blue-500">SafeNav</span></h1>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6">
      <p className="text-lg leading-relaxed">
        SafeNav is a cutting-edge URL security analysis tool designed to protect users from the growing threats of phishing, malware, and social engineering attacks.
      </p>
      <p>
        <strong>How it works:</strong> Unlike traditional blacklists, SafeNav uses a hybrid approach combining static analysis, lexical feature extraction, and a Machine Learning model (Random Forest) to detect zero-day threats in real-time.
      </p>
      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-white font-semibold mb-2">Developed by:</h3>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>[Manish Barti] - Lead Developer</li>
        </ul>
      </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
const App = () => {
  // State for Menu & Navigation
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  // State for Auth & Theme
  const [token, setToken] = useState(localStorage.getItem('safenav_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState("Login"); // Custom message for the modal
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

  // Helper to open modal with a specific title
  const triggerAuthModal = (message = "Login") => {
    setAuthMessage(message);
    setShowAuthModal(true);
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('safenav_token', newToken);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('safenav_token');
    // Optional: Refresh page or reset view
  };

  return (
    <div className="app-container">
      {/* --- NAVIGATION BAR --- */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div className="nav-logo">
            <ShieldCheck className="text-blue-500" />
            <span className="logo-text">SafeNav</span>
          </div>

          <div className="nav-actions">
            {/* Dark Mode Toggle (Always Visible) */}
            <button className="icon-button" onClick={toggleDarkMode}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* HAMBURGER MENU */}
            <div className="relative">
              <button 
                className="icon-button" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu size={24} />
              </button>

              {/* DROPDOWN MENU */}
              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 flex flex-col items-start overflow-hidden">
                  
                  <button 
                    onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck size={18} /> Home
                  </button>

                  <button 
                    onClick={() => { setCurrentPage('about'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <User size={18} /> About Us
                  </button>

                  <div className="border-t border-slate-800 w-full mt-1 pt-1">
                    {token ? (
                      <button 
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    ) : (
                      <button 
                        onClick={() => { triggerAuthModal("Login"); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-blue-400 hover:bg-slate-800 hover:text-blue-300 transition-colors flex items-center gap-2"
                      >
                        <Lock size={18} /> Login
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="main-content">
        {currentPage === 'about' ? (
          <AboutUs />
        ) : (
          <ScannerView 
            token={token} 
            onRequestLogin={() => triggerAuthModal("Scan failed login required")} 
          />
        )}
      </main>

      {/* --- AUTH MODAL --- */}
      {showAuthModal && (
        <AuthModal 
          title={authMessage} // Pass dynamic title
          onClose={() => setShowAuthModal(false)} 
          onLogin={handleLogin} 
        />
      )}
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

// --- SCANNER VIEW COMPONENT ---
const ScannerView = ({ token, onRequestLogin }) => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    // --- ENFORCE LOGIN HERE ---
    if (!token) {
      onRequestLogin(); // Trigger the modal with the "Scan failed..." message
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/scan`, { url }, config);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      // Handle 401 specifically if token expired
      if (err.response && err.response.status === 401) {
        onRequestLogin();
      } else {
        alert("Scan failed. Ensure backend is running.");
      }
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="hero-section"><h1 className="hero-title">Scan links. Reveal hidden risks.</h1></div>
      
      <div className="search-container">
        <form onSubmit={handleScan} className="search-form">
          <Globe className="search-icon" />
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
        <div className="result-container animate-fade-in-up">
          
          {/* VERDICT HEADER */}
          <div className="result-card main-verdict">
             <div className="result-header">
                <div className="header-left">
                    <div className={`verdict-icon ${result.risk_score > 50 ? 'danger' : 'safe'}`}>
                       {result.risk_score > 50 ? <XOctagon /> : <ShieldCheck />}
                    </div>
                    <div className="verdict-text-group">
                       <h2 className={result.risk_score > 50 ? 'danger' : 'safe'}>{result.verdict}</h2>
                       <p className="target-url">Target: {result.url}</p>
                    </div>
                </div>
                <div className="risk-score-display">
                    <div className="risk-score-number">{result.risk_score}</div>
                    <div className="risk-score-label">RISK SCORE</div>
                </div>
             </div>
          </div>
          <br />

          {/* AI INSIGHT */}
          <div className="ai-insight">
             <div className="ai-insight-header"><Activity /><h3>AI Security Insight</h3></div>
             <div className="ai-insight-content">
                {result.reasoning.map((r, i) => <p key={i}>• {r}</p>)}
             </div>
          </div>

          {/* DETAILS GRID */}
          <div className="grid-6-layout">
            <DetailCard title="SSL & Security" icon="🔐" data={result.details.ssl_security} />
            <DetailCard title="Phishing Checks" icon="🎣" data={result.details.phishing_checks} />
            <DetailCard title="Domain Reputation" icon="🌐" data={result.details.domain_reputation} />
            <DetailCard title="Link Structure" icon="🔗" data={result.details.link_structure} />
            <DetailCard title="Redirect Analysis" icon="🔄" data={result.details.redirect_analysis} />
            <DetailCard title="Content Safety" icon="🧾" data={result.details.content_safety} />
          </div>
        </div>
      )}
    </div>
  );
};

// --- AUTH MODAL COMPONENT ---
const AuthModal = ({ onClose, onLogin, title }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/register`, { email, password });
        alert("Registered! Please login."); 
        setIsRegister(false);
      } else {
        const fd = new FormData(); 
        fd.append('username', email); 
        fd.append('password', password);
        const res = await axios.post(`${API_URL}/login`, fd);
        onLogin(res.data.access_token);
      }
    } catch (e) { 
      alert("Authentication Failed. Check credentials."); 
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Uses the dynamic title (e.g., "Scan failed login required") */}
        <h2>{isRegister ? 'Register' : title}</h2>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <button type="submit" className="auth-submit-btn">
            {isRegister ? 'Register' : 'Login'}
          </button>
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