import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Activity, History, Trash2, Moon, Sun, User
} from 'lucide-react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [recentScans, setRecentScans] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('safenav_history');
    if (saved) setRecentScans(JSON.parse(saved));
    
    // Load dark mode preference
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

  const addToHistory = (scanResult) => {
    const newEntry = {
      id: Date.now(),
      url: scanResult.url, 
      score: scanResult.risk_score,
      verdict: scanResult.verdict,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newEntry, ...recentScans].slice(0, 15);
    setRecentScans(updated);
    localStorage.setItem('safenav_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setRecentScans([]);
    localStorage.removeItem('safenav_history');
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div className="nav-logo">
            <div className="logo-icon">
              <ShieldCheck />
            </div>
            <span className="logo-text">SafeNav</span>
          </div>
          <div className="nav-actions">
            <button className="icon-button" onClick={toggleDarkMode} title="Toggle dark mode">
              {darkMode ? <Sun /> : <Moon />}
            </button>
            <button className="icon-button" title="User profile">
              <User />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'scan' ? (
          <ScannerView onScanComplete={addToHistory} />
        ) : (
          <HistoryView scans={recentScans} onClear={clearHistory} />
        )}
      </main>
    </div>
  );
};

const ScannerView = ({ onScanComplete }) => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = 'http://localhost:8000';

  // Helper to check reasoning list for keywords
  const hasFlag = (keyword) => {
    return result?.reasoning?.some(r => r.toLowerCase().includes(keyword.toLowerCase()));
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/scan`, { url });
      const finalResult = { ...response.data, url: url };
      setResult(finalResult);
      onScanComplete(finalResult);
    } catch (err) {
      console.error(err);
      setError('Connection failed. Ensure backend is running on port 8000.');
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">
          Scan links. Reveal hidden risks.
        </h1>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <form onSubmit={handleScan} className="search-form">
          <div className="search-icon">
            <Globe />
          </div>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL here (e.g., google.com)..." 
            className="search-input"
          />
          <button 
            type="submit" 
            disabled={loading || !url}
            className="search-button"
          >
            {loading ? (
              <><Loader2 className="spinner" /> Scanning...</>
            ) : (
              'ANALYZE'
            )}
          </button>
        </form>
        
        {error && (
          <div className="error-message">
            <div className="error-icon"><AlertTriangle /></div>
            <div className="error-content">
              <p className="error-title">Connection Error</p>
              <p className="error-text">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="result-container">
          <div className="result-card">
            {/* Header Section */}
            <div className="result-header">
              <div className="result-info">
                <div className={`verdict-icon ${
                  result.risk_score > 70 ? 'danger' :
                  result.risk_score > 30 ? 'warning' :
                  'safe'
                }`}>
                  {result.risk_score > 70 ? <XOctagon /> : result.risk_score > 30 ? <AlertTriangle /> : <ShieldCheck />}
                </div>
                
                <div className="verdict-details">
                  <h2 className={
                    result.risk_score > 70 ? 'danger' :
                    result.risk_score > 30 ? 'warning' :
                    'safe'
                  }>
                    {result.verdict}
                  </h2>
                  <p className="target-url">
                    Target: <span>{result.url}</span>
                  </p>
                </div>
              </div>
              
              {/* Risk Score */}
              <div className="risk-score-display">
                <div className="risk-score-number">
                  {result.risk_score}<span className="score-max">/100</span>
                </div>
                <div className="risk-score-label">RISK SCORE</div>
              </div>
            </div>

            {/* AI Security Insight */}
            <div className="ai-insight">
              <div className="ai-insight-header">
                <Activity />
                <h3>AI Security Insight</h3>
              </div>
              
              <div className="ai-insight-content">
                {result.reasoning && result.reasoning.length > 0 ? (
                  result.reasoning.map((r, i) => (
                    <p key={i} className="reasoning-item">• {r}</p>
                  ))
                ) : (
                  <p>No specific threats detected. The URL appears to conform to standard safety patterns.</p>
                )}
              </div>
            </div>

            {/* Two Columns */}
            <div className="details-grid">
              {/* Threat Indicators */}
              <div className="details-section">
                <h3>Threat Indicators</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Suspicious TLD:</span>
                    <span className={`detail-value ${hasFlag('TLD') ? 'danger' : 'safe'}`}>
                      {hasFlag('TLD') ? 'Detected' : 'Clean'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Typosquatting:</span>
                    <span className={`detail-value ${hasFlag('Typosquatting') ? 'danger' : 'safe'}`}>
                      {hasFlag('Typosquatting') ? 'Possible Match' : 'None Detected'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Redirect Hops:</span>
                    <span className="detail-value">{result.details?.hop_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Technical Footprint */}
              <div className="details-section">
                <h3>Technical Footprint</h3>
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">Cert Validity (Days):</span>
                    <span className="detail-value">
                      {result.details?.cert_age !== undefined ? `${result.details.cert_age}` : 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Final Destination:</span>
                    <span className="detail-value" title={result.final_destination}>
                      {result.final_destination ? 
                        (result.final_destination.length > 25 ? result.final_destination.substring(0,25)+'...' : result.final_destination) 
                        : 'Same as Input'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Scan Button */}
            <button className="deep-scan-button">
              Initialize Deep Scan Analysis (Login Required)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryView = ({ scans, onClear }) => (
  <div>
    <div className="history-header">
      <div className="history-title">
        <h2>Scan History</h2>
        <p>Your last 15 security scans</p>
      </div>
      {scans.length > 0 && (
        <button onClick={onClear} className="clear-history-button">
          <Trash2 />
          Clear History
        </button>
      )}
    </div>

    <div className="history-table-container">
      {scans.length === 0 ? (
        <div className="empty-history">
          <div className="empty-history-icon"><History /></div>
          <h3>No scan history</h3>
          <p>Start scanning URLs to build your history</p>
        </div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Date</th>
              <th>Verdict</th>
              <th>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id}>
                <td><span className="url-cell">{scan.url}</span></td>
                <td className="date-cell">{scan.date}</td>
                <td>
                  <span className={`verdict-badge ${
                    scan.score > 70 ? 'danger' :
                    scan.score > 30 ? 'warning' :
                    'safe'
                  }`}>
                    {scan.verdict}
                  </span>
                </td>
                <td className="score-cell">{scan.score}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

export default App;