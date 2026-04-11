import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  Brain,
  Lock,
  Globe,
  GitBranch,
  FileSearch,
  ArrowRight,
  Terminal,
  Activity,
  AlertTriangle,
} from "lucide-react";

// ─── Google Font import (Syne display + JetBrains Mono accents) ──────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@400;500&display=swap');
  `}</style>
);

// ─── CSS ─────────────────────────────────────────────────────────────────────
const styles = `
  /* ── Reset & root ─────────────────────────────── */
  .lp-root {
    --cyan:    #00e5ff;
    --cyan-dim: rgba(0,229,255,0.12);
    --navy:    #020817;
    --navy-2:  #0a1628;
    --navy-3:  #0f1f3d;
    --border:  rgba(0,229,255,0.14);
    --border-s: rgba(0,229,255,0.28);
    --text:    #cdd9ea;
    --text-dim: #506280;
    --danger:  #ff4d6d;
    --warn:    #ffb703;
    --safe:    #06d6a0;

    font-family: 'DM Sans', sans-serif;
    background: var(--navy);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  /* ── Animated grid background ─────────────────── */
  .lp-grid-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      linear-gradient(rgba(0,229,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
  }

  /* Subtle radial glow behind hero */
  .lp-glow {
    position: fixed;
    top: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 900px;
    height: 500px;
    background: radial-gradient(ellipse, rgba(0,229,255,0.07) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Layout ────────────────────────────────────── */
  .lp-content {
    position: relative;
    z-index: 1;
  }

  /* ── Hero ──────────────────────────────────────── */
  .lp-hero {
    max-width: 1200px;
    margin: 0 auto;
    padding: 96px 32px 80px;
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 64px;
    align-items: center;
  }

  @media (max-width: 900px) {
    .lp-hero {
      grid-template-columns: 1fr;
      padding: 64px 20px 48px;
      gap: 48px;
    }
  }

  /* ── Eyebrow tag ───────────────────────────────── */
  .lp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--cyan);
    background: var(--cyan-dim);
    border: 1px solid var(--border-s);
    border-radius: 999px;
    padding: 5px 14px;
    margin-bottom: 28px;

    opacity: 0;
    transform: translateY(12px);
    animation: lp-rise 0.5s ease forwards;
    animation-delay: 0.1s;
  }

  .lp-eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cyan);
    animation: lp-pulse 2s ease-in-out infinite;
  }

  @keyframes lp-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }

  /* ── Headline ──────────────────────────────────── */
  .lp-h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2.4rem, 5vw, 4rem);
    font-weight: 800;
    line-height: 1.08;
    color: #e8f0fe;
    margin: 0 0 24px;
    letter-spacing: -0.02em;

    opacity: 0;
    transform: translateY(16px);
    animation: lp-rise 0.55s ease forwards;
    animation-delay: 0.2s;
  }

  .lp-h1 em {
    font-style: normal;
    color: var(--cyan);
  }

  /* ── Sub-copy ───────────────────────────────────── */
  .lp-sub {
    font-size: 1.05rem;
    line-height: 1.75;
    color: var(--text-dim);
    max-width: 520px;
    margin: 0 0 40px;

    opacity: 0;
    transform: translateY(16px);
    animation: lp-rise 0.55s ease forwards;
    animation-delay: 0.32s;
  }

  /* ── CTA row ────────────────────────────────────── */
  .lp-cta-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;

    opacity: 0;
    transform: translateY(16px);
    animation: lp-rise 0.55s ease forwards;
    animation-delay: 0.44s;
  }

  .lp-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 13px 26px;
    background: var(--cyan);
    color: var(--navy);
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    box-shadow: 0 0 0 0 rgba(0,229,255,0.4);
  }

  .lp-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,229,255,0.3);
  }

  .lp-btn-primary:active { transform: translateY(0); }

  .lp-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 13px 22px;
    background: transparent;
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    border: 1px solid var(--border-s);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, transform 0.18s;
  }

  .lp-btn-secondary:hover {
    border-color: var(--cyan);
    color: var(--cyan);
    transform: translateY(-2px);
  }

  /* ── Stat row ───────────────────────────────────── */
  .lp-stats {
    display: flex;
    gap: 36px;
    margin-top: 48px;
    flex-wrap: wrap;

    opacity: 0;
    animation: lp-rise 0.55s ease forwards;
    animation-delay: 0.58s;
  }

  .lp-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .lp-stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    color: #e8f0fe;
    letter-spacing: -0.02em;
  }

  .lp-stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .lp-stat-divider {
    width: 1px;
    background: var(--border);
    align-self: stretch;
  }

  /* ── Threat widget (right column) ──────────────── */
  .lp-widget {
    background: var(--navy-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(0,229,255,0.06) inset,
      0 40px 80px rgba(0,0,0,0.5);

    opacity: 0;
    transform: translateY(20px) scale(0.98);
    animation: lp-rise 0.6s ease forwards;
    animation-delay: 0.3s;
  }

  .lp-widget-header {
    padding: 14px 18px;
    background: rgba(0,229,255,0.04);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--cyan);
    letter-spacing: 0.06em;
  }

  .lp-widget-dots {
    display: flex;
    gap: 5px;
    margin-left: auto;
  }

  .lp-widget-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .lp-widget-body { padding: 20px 18px; display: flex; flex-direction: column; gap: 12px; }

  /* Each scan row */
  .lp-scan-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--navy-3);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    animation: lp-slide-in 0.4s ease forwards;
    opacity: 0;
  }

  @keyframes lp-slide-in {
    from { opacity: 0; transform: translateX(12px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .lp-scan-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .lp-scan-badge.danger  { background: rgba(255,77,109,0.15); color: var(--danger); border: 1px solid rgba(255,77,109,0.25); }
  .lp-scan-badge.warning { background: rgba(255,183,3,0.12);  color: var(--warn);   border: 1px solid rgba(255,183,3,0.22); }
  .lp-scan-badge.safe    { background: rgba(6,214,160,0.1);   color: var(--safe);   border: 1px solid rgba(6,214,160,0.2); }

  .lp-scan-url {
    flex: 1;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lp-scan-score {
    font-weight: 600;
    flex-shrink: 0;
    color: var(--text);
  }

  .lp-widget-footer {
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.06em;
  }

  .lp-live-dot {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--safe);
  }

  .lp-live-dot::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--safe);
    animation: lp-pulse 1.4s ease-in-out infinite;
  }

  /* ── Section: Features ─────────────────────────── */
  .lp-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 32px;
  }

  @media (max-width: 640px) { .lp-section { padding: 56px 20px; } }

  .lp-section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--cyan);
    margin-bottom: 14px;
  }

  .lp-section-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.7rem, 3vw, 2.4rem);
    font-weight: 800;
    color: #e8f0fe;
    letter-spacing: -0.02em;
    max-width: 520px;
    line-height: 1.18;
    margin: 0 0 14px;
  }

  .lp-section-sub {
    font-size: 0.98rem;
    color: var(--text-dim);
    max-width: 540px;
    line-height: 1.7;
    margin: 0 0 56px;
  }

  /* ── Feature grid ───────────────────────────────── */
  .lp-features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }

  @media (max-width: 900px) { .lp-features { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .lp-features { grid-template-columns: 1fr; } }

  .lp-feature {
    background: var(--navy-2);
    padding: 32px 28px;
    transition: background 0.2s;
    cursor: default;
    position: relative;
    overflow: hidden;
  }

  .lp-feature::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--cyan-dim) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .lp-feature:hover::before { opacity: 1; }

  .lp-feature-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: var(--navy-3);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    transition: border-color 0.2s;
  }

  .lp-feature:hover .lp-feature-icon { border-color: var(--cyan); }

  .lp-feature-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--cyan);
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  .lp-feature-title {
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #e8f0fe;
    margin: 0 0 8px;
  }

  .lp-feature-body {
    font-size: 0.88rem;
    color: var(--text-dim);
    line-height: 1.65;
  }

  /* ── Score demo strip ───────────────────────────── */
  .lp-score-strip {
    margin-top: 80px;
    background: var(--navy-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 40px 40px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 40px;
    align-items: center;
  }

  @media (max-width: 720px) {
    .lp-score-strip { grid-template-columns: 1fr; padding: 28px 24px; }
  }

  .lp-score-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: #e8f0fe;
    margin: 0 0 8px;
  }

  .lp-score-sub {
    font-size: 0.88rem;
    color: var(--text-dim);
    max-width: 400px;
    line-height: 1.65;
  }

  .lp-tiers {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }

  .lp-tier {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 20px;
    border-radius: 10px;
    border: 1px solid;
    min-width: 80px;
  }

  .lp-tier.safe    { background: rgba(6,214,160,0.07);  border-color: rgba(6,214,160,0.2);  color: var(--safe); }
  .lp-tier.warning { background: rgba(255,183,3,0.07);  border-color: rgba(255,183,3,0.2);  color: var(--warn); }
  .lp-tier.danger  { background: rgba(255,77,109,0.07); border-color: rgba(255,77,109,0.2); color: var(--danger); }

  .lp-tier-range {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
  }

  .lp-tier-label {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  /* ── Final CTA ──────────────────────────────────── */
  .lp-cta-section {
    max-width: 1200px;
    margin: 0 auto 100px;
    padding: 0 32px;
  }

  .lp-cta-box {
    background: linear-gradient(135deg, var(--navy-3) 0%, var(--navy-2) 100%);
    border: 1px solid var(--border-s);
    border-radius: 20px;
    padding: 72px 48px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .lp-cta-box::before {
    content: '';
    position: absolute;
    top: -60%;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 300px;
    background: radial-gradient(ellipse, rgba(0,229,255,0.09) 0%, transparent 70%);
    pointer-events: none;
  }

  .lp-cta-box h2 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 800;
    color: #e8f0fe;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }

  .lp-cta-box p {
    font-size: 1rem;
    color: var(--text-dim);
    max-width: 420px;
    margin: 0 auto 36px;
    line-height: 1.7;
  }

  /* ── Divider ────────────────────────────────────── */
  .lp-divider {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    border: none;
    border-top: 1px solid var(--border);
  }

  /* ── Keyframes ──────────────────────────────────── */
  @keyframes lp-rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Mock scan data for the live widget ──────────────────────────────────────
const MOCK_SCANS = [
  { url: "paypa1-secure.verify-id.com", score: 94, tier: "danger"  },
  { url: "github.com/anthropics/courses", score: 4,  tier: "safe"   },
  { url: "t.co/xkzj194shortlink",        score: 58, tier: "warning" },
  { url: "accounts.google.com/signin",   score: 6,  tier: "safe"   },
  { url: "dl.malware-cdn.xyz/setup.exe", score: 100, tier: "danger" },
];

const TIER_LABEL = { danger: "HIGH RISK", warning: "CAUTION", safe: "SAFE" };

// ─── Animated threat widget ───────────────────────────────────────────────────
const ThreatWidget = () => {
  const [visible, setVisible] = useState([MOCK_SCANS[0], MOCK_SCANS[1]]);
  const [counter, setCounter] = useState(3847);
  const indexRef = useRef(2);

  useEffect(() => {
    const id = setInterval(() => {
      const next = MOCK_SCANS[indexRef.current % MOCK_SCANS.length];
      indexRef.current += 1;
      setVisible((prev) => [next, ...prev].slice(0, 4));
      setCounter((c) => c + Math.floor(Math.random() * 3 + 1));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="lp-widget">
      <div className="lp-widget-header">
        <Terminal size={13} />
        safenav // live threat stream
        <div className="lp-widget-dots">
          <div className="lp-widget-dot" style={{ background: "#ff5f57" }} />
          <div className="lp-widget-dot" style={{ background: "#febc2e" }} />
          <div className="lp-widget-dot" style={{ background: "#28c840" }} />
        </div>
      </div>

      <div className="lp-widget-body">
        {visible.map((scan, i) => (
          <div
            key={`${scan.url}-${i}`}
            className="lp-scan-row"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className={`lp-scan-badge ${scan.tier}`}>
              {TIER_LABEL[scan.tier]}
            </span>
            <span className="lp-scan-url">{scan.url}</span>
            <span className="lp-scan-score">{scan.score}</span>
          </div>
        ))}
      </div>

      <div className="lp-widget-footer">
        <span className="lp-live-dot">ENGINE ACTIVE</span>
        <span>{counter.toLocaleString()} SCANS TODAY</span>
      </div>
    </div>
  );
};

// ─── Feature data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <FileSearch size={18} color="#00e5ff" />,
    num: "01",
    title: "Lexical & Static Analysis",
    body: "Shannon entropy scoring, Levenshtein typosquatting detection, suspicious keyword flagging — all in milliseconds from the URL string alone.",
  },
  {
    icon: <Brain size={18} color="#00e5ff" />,
    num: "02",
    title: "ML Risk Prediction",
    body: "A Random Forest classifier trained on PhishTank data outputs a 0–1 malice probability with feature importances — no black-box verdicts.",
  },
  {
    icon: <Lock size={18} color="#00e5ff" />,
    num: "03",
    title: "SSL / TLS Inspection",
    body: "Certificate age, issuer trust level (DV/OV/EV), cipher suite strength, and SNI compatibility — because HTTPS alone isn't safety.",
  },
  {
    icon: <Globe size={18} color="#00e5ff" />,
    num: "04",
    title: "Domain Intelligence",
    body: "WHOIS / RDAP lookup checks registration age, suspicious TLDs, and registrar reputation. Domains under 7 days old are flagged critical.",
  },
  {
    icon: <GitBranch size={18} color="#00e5ff" />,
    num: "05",
    title: "Redirect Chain Tracing",
    body: "Follows up to 10 redirect hops without executing JavaScript, detecting cross-domain bounces, cloaking, and meta-refresh tricks.",
  },
  {
    icon: <Zap size={18} color="#00e5ff" />,
    num: "06",
    title: "Weighted Risk Fusion",
    body: "All module outputs merge into a single 0–100 score. Critical indicators (insecure login form, blacklist hit) immediately override to 100.",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
const LandingPage = ({ onRequestLogin }) => {
  const navigate = useNavigate();

  return (
    <>
      <FontLoader />
      <style>{styles}</style>

      <div className="lp-root">
        <div className="lp-grid-bg" />
        <div className="lp-glow" />

        <div className="lp-content">

          {/* ── HERO ─────────────────────────────────────────── */}
          <section className="lp-hero">
            {/* Left column */}
            <div>
              <div className="lp-eyebrow">
                <span className="lp-eyebrow-dot" />
                Phase 1 · Static Analysis Engine
              </div>

              <h1 className="lp-h1">
                Enterprise-grade<br />
                <em>URL security</em><br />
                without the noise.
              </h1>

              <p className="lp-sub">
                SafeNav runs 8 parallel analysis modules — lexical heuristics, SSL
                inspection, domain intelligence, and a trained ML model — before
                a single byte of the target page loads.
              </p>

              <div className="lp-cta-row">
                <button
                  className="lp-btn-primary"
                  onClick={() => navigate("/scan")}
                >
                  Start Scanning <ArrowRight size={15} />
                </button>
                <button
                  className="lp-btn-secondary"
                  onClick={() => onRequestLogin("Create your free account")}
                >
                  Create Account
                </button>
              </div>

              <div className="lp-stats">
                <div className="lp-stat">
                  <span className="lp-stat-num">8</span>
                  <span className="lp-stat-label">Analysis Modules</span>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <span className="lp-stat-num">~90%</span>
                  <span className="lp-stat-label">Caught at Phase 1</span>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <span className="lp-stat-num">&lt;3s</span>
                  <span className="lp-stat-label">Avg. Scan Time</span>
                </div>
              </div>
            </div>

            {/* Right column — live widget */}
            <ThreatWidget />
          </section>

          <hr className="lp-divider" />

          {/* ── FEATURES ─────────────────────────────────────── */}
          <section className="lp-section">
            <p className="lp-section-label">// core capabilities</p>
            <h2 className="lp-section-title">
              Six layers between you and the threat.
            </h2>
            <p className="lp-section-sub">
              Every module is independent, parallelised via Celery, and feeds
              into a single weighted score with plain-English reasoning — not
              just a number.
            </p>

            <div className="lp-features">
              {FEATURES.map((f) => (
                <div className="lp-feature" key={f.num}>
                  <div className="lp-feature-icon">{f.icon}</div>
                  <div className="lp-feature-num">// {f.num}</div>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-body">{f.body}</p>
                </div>
              ))}
            </div>

            {/* Score tier strip */}
            <div className="lp-score-strip">
              <div>
                <h3 className="lp-score-title">Three-tier verdict system</h3>
                <p className="lp-score-sub">
                  Every scan resolves to one of three clear verdicts with a
                  full reasoning list — so you know <em>why</em>, not just
                  what the score was.
                </p>
              </div>
              <div className="lp-tiers">
                <div className="lp-tier safe">
                  <span className="lp-tier-range">0–30</span>
                  <span className="lp-tier-label">Safe</span>
                </div>
                <div className="lp-tier warning">
                  <span className="lp-tier-range">31–69</span>
                  <span className="lp-tier-label">Caution</span>
                </div>
                <div className="lp-tier danger">
                  <span className="lp-tier-range">70–100</span>
                  <span className="lp-tier-label">Danger</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="lp-divider" />

          {/* ── FINAL CTA ────────────────────────────────────── */}
          <section className="lp-cta-section">
            <div className="lp-cta-box">
              <h2>Don't click blind.</h2>
              <p>
                Paste any link and get a full security report in under three
                seconds — free, no extension required.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  className="lp-btn-primary"
                  onClick={() => navigate("/scan")}
                >
                  Analyze a URL <ArrowRight size={15} />
                </button>
                <button
                  className="lp-btn-secondary"
                  onClick={() => navigate("/about")}
                >
                  Learn how it works
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default LandingPage;