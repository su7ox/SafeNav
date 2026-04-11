import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { scanUrl, fetchHistory } from "./services/api";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Search,
  Lock,
  History,
  LogOut,
  User,
  Loader2,
  Menu,
  Globe,
  Sun,
  Moon,
  XOctagon,
  Activity,
  X,
  Home,
  Info,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────
// ABOUT US PAGE
// ─────────────────────────────────────────────
const AboutUs = () => (
  <div className="max-w-4xl mx-auto px-6 py-12 text-slate-300 animate-fade-in">
    <h1 className="text-4xl font-bold text-white mb-6">
      About <span className="text-blue-500">SafeNav</span>
    </h1>
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6">
      <p className="text-lg leading-relaxed">
        SafeNav is a cutting-edge URL security analysis tool designed to protect
        users from the growing threats of phishing, malware, and social
        engineering attacks.
      </p>
      <p>
        <strong>How it works:</strong> Unlike traditional blacklists, SafeNav
        uses a hybrid approach combining static analysis, lexical feature
        extraction, and a Machine Learning model (Random Forest) to detect
        zero-day threats in real-time.
      </p>
      <div className="pt-4 border-t border-slate-800">
        <h3 className="text-white font-semibold mb-2">Developed by:</h3>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>[Manish Barti] - Lead Developer</li>
          <li>[Rajan] - Frontend Developer</li>
          <li>[Md. Shahan] - Backend Developer</li>
          <li>[Aayushman Mishra] - Tester</li>
        </ul>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// HISTORY VIEW  (maps to "/history")
// ─────────────────────────────────────────────
const HistoryView = ({ token, onRequestLogin }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      onRequestLogin("Login Required");
      navigate("/");
      return;
    }

    const loadHistory = async () => {
      try {
        const data = await fetchHistory(token);
        setHistory(data);
      } catch (err) {
        setError("Failed to load history.");
        if (err.response?.status === 401) {
          onRequestLogin("Session expired — please login again");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [token]);

  if (loading)
    return (
      <div className="p-10 text-center text-slate-400">
        <Loader2 className="animate-spin mx-auto mb-2" />
        Loading History...
      </div>
    );

  if (error)
    return <div className="p-10 text-center text-rose-400">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <History className="text-blue-500" /> Scan History
      </h1>

      {history.length === 0 ? (
        <div className="text-center text-slate-500 bg-slate-900 p-12 rounded-xl border border-slate-800">
          <p>No scans found. Start by analyzing a URL!</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">URL</th>
                  <th className="p-4 font-semibold">Verdict</th>
                  <th className="p-4 font-semibold text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 text-slate-400 text-sm whitespace-nowrap">
                      {new Date(scan.scan_time).toLocaleDateString()}{" "}
                      <span className="text-xs opacity-50">
                        {new Date(scan.scan_time).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="p-4 text-white font-medium max-w-[250px] sm:max-w-md md:max-w-lg lg:max-w-xl break-all">
                      <a
                        href={scan.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                      >
                        {scan.url}
                      </a>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          scan.risk_score > 69
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : scan.risk_score > 30
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {scan.risk_score > 69 ? (
                          <XOctagon size={12} />
                        ) : scan.risk_score > 30 ? (
                          <AlertTriangle size={12} />
                        ) : (
                          <ShieldCheck size={12} />
                        )}
                        {scan.verdict}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-300">
                      {scan.risk_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// DETAIL CARD
// ─────────────────────────────────────────────
const DetailCard = ({ title, icon, data }) => (
  <div className="detail-card">
    <div className="detail-header">
      <span className="detail-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <div className="detail-content">
      {Object.entries(data).map(([key, value]) => {
        const isUrl = typeof value === "string" && value.startsWith("http");
        return (
          <div
            key={key}
            className="detail-row"
            style={{ alignItems: isUrl ? "flex-start" : "center" }}
          >
            <span className="detail-label min-w-[130px] shrink-0">
              {key.replace(/_/g, " ")}:
            </span>

            {isUrl ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
                style={{
                  wordBreak: "break-all",
                  textAlign: "right",
                  flexGrow: 1,
                }}
              >
                {value}
              </a>
            ) : (
              <span
                className={`detail-value ${
                  value === "Yes" || value === "Unsafe" || value === "Expired"
                    ? "danger"
                    : ""
                }`}
                style={
                  typeof value === "string" && value.length > 25
                    ? { wordBreak: "break-all", textAlign: "right" }
                    : {}
                }
              >
                {value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// SCANNER VIEW  (maps to "/scan")
// ─────────────────────────────────────────────
const ScannerView = ({ token, onRequestLogin }) => {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    if (!token) {
      onRequestLogin("Login to Scan");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/scan`, { url }, config);
      setResult(response.data);
      toast.success("Scan complete!");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        onRequestLogin("Session expired — please login again");
      } else {
        toast.error("Scan failed. Ensure the backend is running.");
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="hero-section">
        <h1 className="hero-title">
          Scan links.
          <br />
          Reveal hidden risks.
        </h1>
      </div>

      <div className="search-container">
        <form onSubmit={handleScan} className="search-form">
          <Globe className="search-icon" size={18} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a URL to analyze…"
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? (
              <>
                <Loader2 className="spinner" size={16} /> Scanning…
              </>
            ) : (
              <>
                <Search size={15} /> Analyze
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="result-container animate-fade-in-up">
          {/* VERDICT HEADER */}
          <div className="result-card main-verdict">
            <div className="result-header">
              <div className="header-left">
                <div
                  className={`verdict-icon ${
                    result.risk_score > 69
                      ? "danger"
                      : result.risk_score > 30
                        ? "warning"
                        : "safe"
                  }`}
                >
                  {result.risk_score > 69 ? (
                    <XOctagon size={28} />
                  ) : result.risk_score > 30 ? (
                    <AlertTriangle size={28} />
                  ) : (
                    <ShieldCheck size={28} />
                  )}
                </div>
                <div className="verdict-text-group">
                  <h2
                    className={
                      result.risk_score > 69
                        ? "danger"
                        : result.risk_score > 30
                          ? "warning"
                          : "safe"
                    }
                  >
                    {result.verdict}
                  </h2>
                  <p className="target-url">Target: {result.url}</p>
                </div>
              </div>
              <div className="risk-score-display">
                <div
                  className={`risk-score-number ${
                    result.risk_score > 69
                      ? "score-danger"
                      : result.risk_score > 30
                        ? "score-warning"
                        : "score-safe"
                  }`}
                >
                  {result.risk_score}
                </div>
                <div className="risk-score-label">Risk Score</div>
              </div>
            </div>
          </div>

          <br />

          {/* AI INSIGHT */}
          <div className="ai-insight">
            <div className="ai-insight-header">
              <Activity size={15} />
              <h3>AI Security Insight</h3>
            </div>
            <div className="ai-insight-content">
              {result.reasoning.map((r, i) => (
                <p key={i}>• {r}</p>
              ))}
            </div>
          </div>

          {/* DETAILS GRID */}
          <div className="grid-6-layout">
            <DetailCard
              title="SSL & Security"
              icon="🔐"
              data={result.details.ssl_security}
            />
            <DetailCard
              title="Phishing Checks"
              icon="🎣"
              data={result.details.phishing_checks}
            />
            <DetailCard
              title="Domain Reputation"
              icon="🌐"
              data={result.details.domain_reputation}
            />
            <DetailCard
              title="Link Structure"
              icon="🔗"
              data={result.details.link_structure}
            />
            <DetailCard
              title="Redirect Analysis"
              icon="🔄"
              data={result.details.redirect_analysis}
            />
            <DetailCard
              title="Content Safety"
              icon="🧾"
              data={result.details.content_safety}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────
const AuthModal = ({ onClose, onLogin, title }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/register`, { email, password });
        toast.success("Account created! Please sign in.");
        setIsRegister(false);
      } else {
        const fd = new FormData();
        fd.append("username", email);
        fd.append("password", password);
        const res = await axios.post(`${API_URL}/login`, fd);
        onLogin(res.data.access_token);
        toast.success("Logged in successfully!");
      }
    } catch {
      toast.error("Authentication failed. Check your credentials.");
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-logo">
            <ShieldCheck size={20} />
          </div>
          <h2>{isRegister ? "Create Account" : title}</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit-btn">
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Sign In" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ROOT APP  —  Router Shell
// ─────────────────────────────────────────────
const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("safenav_token"));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState("Login");
  const [darkMode, setDarkMode] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Restore theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("safenav_theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMenuOpen && !e.target.closest(".nav-menu-wrapper")) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Close mobile menu on viewport resize to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("safenav_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("safenav_theme", "light");
    }
  };

  const triggerAuthModal = (message = "Login") => {
    setAuthMessage(message);
    setShowAuthModal(true);
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("safenav_token", newToken);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("safenav_token");
    navigate("/");
    toast("Logged out.", { icon: "👋" });
  };

  const navLinks = [
    { path: "/", label: "Home", Icon: Home },
    { path: "/scan", label: "Scanner", Icon: ShieldCheck },
    { path: "/history", label: "History", Icon: History },
    { path: "/dashboard", label: "Dashboard", Icon: Activity },
    { path: "/about", label: "About", Icon: Info },
  ];

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <div className="app-container">
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155",
          },
        }}
      />

      {/* ── NAVIGATION BAR ─────────────────────────────────── */}
      <nav className="nav-bar">
        <div className="nav-content">
          {/* Logo */}
          <button className="nav-logo" onClick={() => navigate("/")}>
            <div className="logo-icon-wrap">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="logo-text">SafeNav</span>
          </button>

          {/* Desktop nav links */}
          <div className="nav-links-desktop">
            {navLinks.map(({ path, label, Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`nav-link-btn ${isActive(path) ? "active" : ""}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="nav-actions">
            {/* Theme toggle */}
            <button
              className="icon-button theme-toggle"
              onClick={toggleDarkMode}
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth button (desktop) */}
            <div className="nav-auth-desktop">
              {token ? (
                <button className="auth-chip logout" onClick={handleLogout}>
                  <LogOut size={14} /> Logout
                </button>
              ) : (
                <button
                  className="auth-chip login"
                  onClick={() => triggerAuthModal("Login")}
                >
                  <Lock size={14} /> Login
                </button>
              )}
            </div>

            {/* Hamburger (mobile only) */}
            <div className="nav-menu-wrapper">
              <button
                className={`hamburger-btn ${isMenuOpen ? "open" : ""}`}
                onClick={() => setIsMenuOpen((o) => !o)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <span className="ham-bar bar1" />
                <span className="ham-bar bar2" />
                <span className="ham-bar bar3" />
              </button>

              {/* Mobile dropdown */}
              {isMenuOpen && (
                <div className="mobile-dropdown">
                  <div className="mobile-dropdown-links">
                    {navLinks.map(({ path, label, Icon }) => (
                      <button
                        key={path}
                        onClick={() => {
                          navigate(path);
                          setIsMenuOpen(false);
                        }}
                        className={`mobile-nav-item ${isActive(path) ? "active" : ""}`}
                      >
                        <Icon size={17} />
                        {label}
                        {isActive(path) && (
                          <span className="mobile-active-dot" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mobile-dropdown-divider" />
                  <div className="mobile-dropdown-auth">
                    {token ? (
                      <button
                        className="mobile-auth-btn logout"
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    ) : (
                      <button
                        className="mobile-auth-btn login"
                        onClick={() => {
                          triggerAuthModal("Login");
                          setIsMenuOpen(false);
                        }}
                      >
                        <Lock size={16} /> Login
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT — Route Definitions ───────────────── */}
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage token={token} onRequestLogin={triggerAuthModal} />
            }
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard token={token} onRequestLogin={triggerAuthModal} />
            }
          />
          <Route
            path="/scan"
            element={
              <ScannerView token={token} onRequestLogin={triggerAuthModal} />
            }
          />
          <Route
            path="/history"
            element={
              <HistoryView token={token} onRequestLogin={triggerAuthModal} />
            }
          />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </main>

      {/* ── AUTH MODAL ──────────────────────────────────────── */}
      {showAuthModal && (
        <AuthModal
          title={authMessage}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default App;
