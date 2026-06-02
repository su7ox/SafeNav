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
import HistoryPage from './pages/History';
import AboutUs from "./pages/AboutUs";
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
// DETAIL CARD
// ─────────────────────────────────────────────
const DetailCard = ({ title, icon, data }) => (
  <div className="detail-card">
    <div className="detail-header">
      <span className="detail-icon">{icon}</span>
      <h3>{title}</h3>
    </div>
    <div className="detail-content">
      {Object.entries(data ?? {}).map(([key, value]) => {
        const isUrl = typeof value === "string" && value.startsWith("http");
        const normalized = String(value ?? "").trim().toLowerCase();
        const isDanger =
          value === true ||
          normalized === "yes" ||
          normalized === "unsafe" ||
          normalized === "expired" ||
          normalized === "detected" ||
          normalized === "high" ||
          normalized === "malicious" ||
          normalized === "phishing";
        const isSafe =
          value === false ||
          normalized === "no" ||
          normalized === "safe" ||
          normalized === "valid" ||
          normalized === "not detected" ||
          normalized === "clean" ||
          normalized === "low";

        const valueTone = isDanger ? "danger" : isSafe ? "safe" : "";
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
                className={`detail-value ${valueTone}`}
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

  const isPrivateOrInternalHost = (host) => {
    if (!host) return false;
    const h = String(host).trim().toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost")) return true;
    if (h === "127.0.0.1" || h === "::1") return true;
    if (h === "0.0.0.0") return true;

    // IPv4 private, loopback, link-local, CGNAT
    const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;
    const o = ipv4.slice(1).map((n) => Number(n));
    if (o.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

    const [a, b] = o;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)

    return false;
  };

  const extractHost = (input) => {
    const raw = String(input ?? "").trim();
    if (!raw) return "";
    try {
      // URL() requires a protocol; default to https for host parsing
      const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
      return parsed.hostname;
    } catch {
      return "";
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    if (!token) {
      onRequestLogin("Login to Scan");
      return;
    }

    const host = extractHost(url);
    if (isPrivateOrInternalHost(host)) {
      toast.error("Can't scan internal/private IP addresses.");
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
        const backendMsg =
          err?.response?.data?.detail ??
          err?.response?.data?.message ??
          err?.response?.data?.error ??
          err?.message ??
          "";

        if (String(backendMsg).toLowerCase().includes("internal ip")) {
          toast.error("Can't scan internal/private IP addresses.");
        } else {
          toast.error("Scan failed. Please try again.");
        }
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
          <div className="result-stack">
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
                    {/* FIX 1: Support both verdict AND risk_level */}
                    <h2
                      className={
                        result.risk_score > 69
                          ? "danger"
                          : result.risk_score > 30
                            ? "warning"
                            : "safe"
                      }
                    >
                      {result.risk_level || result.verdict}
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

            {/* AI INSIGHT */}
            <div className="ai-insight">
              <div className="ai-insight-header">
                <Activity size={15} />
                <h3> Security Insight</h3>
              </div>
              <div className="ai-insight-content">
                {/* FIX 2: Fallback to an empty array so map() NEVER crashes */}
                {(result.risk_factors || result.reasoning || []).map((r, i) => (
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
            </div>
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
              <HistoryPage token={token} onRequestLogin={triggerAuthModal} />
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