import React, { useState, useEffect } from "react";
import axios from "axios";
import { ResultsGrid } from "./components/ResultsGrid";
import Navbar from "./components/Navbar";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import HistoryPage from "./pages/History";
import AuthPage from "./pages/AuthPage";
import AboutUs from "./pages/AboutUs";
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  Loader2,
  Globe,
  XOctagon,
  Activity,
  X,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────
// SCANNER VIEW
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

    const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4) return false;
    const o = ipv4.slice(1).map((n) => Number(n));
    if (o.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;

    const [a, b] = o;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;

    return false;
  };

  const extractHost = (input) => {
    const raw = String(input ?? "").trim();
    if (!raw) return "";
    try {
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
                    <p className="target-url">
                      Destination:{" "}
                      <a
                        href={
                          result.details?.redirect_analysis
                            ?.final_destination || result.url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "inherit",
                          textDecoration: "underline",
                        }}
                        title="Click to visit the final destination safely"
                      >
                        {result.details?.redirect_analysis?.final_destination ||
                          result.url}
                      </a>
                    </p>
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

            {/* INSIGHT */}
            <div className="ai-insight">
              <div
                className="ai-insight-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Activity size={15} />
                  <h3 style={{ margin: 0 }}> Security Insight</h3>
                </div>

                {result.classification?.category_label &&
                  result.classification.category_label !== " Unknown" && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        padding: "4px 10px",
                        borderRadius: "99px",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {result.classification.category_label}
                    </span>
                  )}
              </div>

              {result.details?.link_structure?.link_category ===
                "Shortened" && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    backgroundColor: "rgba(255, 183, 3, 0.1)",
                    border: "1px solid rgba(255, 183, 3, 0.25)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span>
                      <strong>Shortener Detected:</strong> This link originally
                      started at{" "}
                      <strong style={{ color: "var(--cyan)" }}>
                        {result.details.link_structure.original_domain}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="ai-insight-content">
                {(result.risk_factors || result.reasoning || []).map((r, i) => (
                  <p key={i}>• {r}</p>
                ))}
              </div>
            </div>

            {/* DETAILS GRID */}
            <ResultsGrid results={result} />
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
  const [token, setToken] = useState(localStorage.getItem("safenav_token"));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState("Login");
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Restore theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("safenav_theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
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

      {/* ── SEPARATED NAVBAR COMPONENT ─────────────────────── */}
      <Navbar
        token={token}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        triggerAuthModal={triggerAuthModal}
      />

      {/* ── MAIN CONTENT — Route Definitions ───────────────── */}
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage token={token} onRequestLogin={triggerAuthModal} />
            }
          />
          <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
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
