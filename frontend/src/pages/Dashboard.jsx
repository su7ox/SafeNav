import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import {
  ShieldCheck,
  AlertTriangle,
  XOctagon,
  Search,
  History,
  Activity,
  Loader2,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
  Globe,
  ShieldAlert,
  FileSearch,
  Wifi,
} from "lucide-react";
import { fetchHistory } from "../services/api";

// ─── Font loader ──────────────────────────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@400;500&display=swap');
  `}</style>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  /* ── Root & tokens ────────────────────────────── */
  .db-root {
    --cyan:      #00e5ff;
    --cyan-dim:  rgba(0,229,255,0.10);
    --cyan-dim2: rgba(0,229,255,0.05);
    --navy:      #020817;
    --navy-2:    #0a1628;
    --navy-3:    #0f1f3d;
    --border:    rgba(0,229,255,0.12);
    --border-s:  rgba(0,229,255,0.26);
    --text:      #cdd9ea;
    --text-dim:  #4e6180;
    --danger:    #ff4d6d;
    --warn:      #ffb703;
    --safe:      #06d6a0;
    --high:      #ff8c42;

    font-family: 'DM Sans', sans-serif;
    background: var(--navy);
    color: var(--text);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Subtle grid background ───────────────────── */
  .db-grid-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      linear-gradient(rgba(0,229,255,0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.028) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%);
  }

  /* ── Layout wrapper ───────────────────────────── */
  .db-content {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 56px 32px 96px;
  }

  @media (max-width: 640px) { .db-content { padding: 36px 16px 72px; } }

  /* ── Page header ──────────────────────────────── */
  .db-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 48px;
    opacity: 0;
    transform: translateY(10px);
    animation: db-rise 0.45s ease forwards;
  }

  .db-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--cyan);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .db-eyebrow-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--cyan);
    animation: db-pulse 1.8s ease-in-out infinite;
  }

  @keyframes db-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  .db-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 800;
    color: #e8f0fe;
    margin: 0;
    letter-spacing: -0.025em;
    line-height: 1.1;
  }

  .db-title span { color: var(--cyan); }

  .db-header-actions {
    display: flex;
    gap: 10px;
  }

  .db-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.82rem;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s, color 0.16s;
  }

  .db-action-btn.primary {
    background: var(--cyan);
    color: var(--navy);
    border: none;
  }

  .db-action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,229,255,0.28);
  }

  .db-action-btn.ghost {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border-s);
  }

  .db-action-btn.ghost:hover {
    border-color: var(--cyan);
    color: var(--cyan);
    transform: translateY(-2px);
  }

  /* ── Main grid: chart left, stats right ───────── */
  .db-main-grid {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  @media (max-width: 900px) { .db-main-grid { grid-template-columns: 1fr; } }

  /* ── Shared card shell ────────────────────────── */
  .db-card {
    background: var(--navy-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .db-card:hover { border-color: var(--border-s); }

  .db-card-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    padding: 18px 22px 0;
  }

  /* ── Donut chart card ─────────────────────────── */
  .db-chart-card {
    padding: 0 0 24px;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transform: translateY(14px);
    animation: db-rise 0.5s ease forwards;
    animation-delay: 0.1s;
  }

  .db-chart-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 0;
    position: relative;
  }

  .db-donut-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -54%);
    text-align: center;
    pointer-events: none;
  }

  .db-donut-big {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    color: #e8f0fe;
    line-height: 1;
  }

  .db-donut-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-top: 4px;
  }

  .db-legend {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 0 22px;
    margin-top: 8px;
  }

  .db-legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text);
  }

  .db-legend-swatch {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .db-legend-count {
    color: var(--text-dim);
    font-size: 10px;
  }

  .db-tooltip {
    background: var(--navy-3);
    border: 1px solid var(--border-s);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text);
  }

  .db-tooltip-label { color: var(--text-dim); font-size: 10px; margin-bottom: 3px; }

  /* ── Stat cards 2×2 grid ──────────────────────── */
  .db-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 480px) { .db-stats-grid { grid-template-columns: 1fr; } }

  .db-stat-card {
    padding: 24px 22px 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    cursor: default;
    opacity: 0;
    transform: translateY(14px);
    animation: db-rise 0.5s ease forwards;
  }

  .db-stat-card:nth-child(1) { animation-delay: 0.15s; }
  .db-stat-card:nth-child(2) { animation-delay: 0.22s; }
  .db-stat-card:nth-child(3) { animation-delay: 0.29s; }
  .db-stat-card:nth-child(4) { animation-delay: 0.36s; }

  .db-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 16px 16px 0 0;
    opacity: 0.6;
  }

  .db-stat-card.c-total::before   { background: var(--cyan); }
  .db-stat-card.c-threats::before { background: var(--danger); }
  .db-stat-card.c-caution::before { background: var(--warn); }
  .db-stat-card.c-safe::before    { background: var(--safe); }

  .db-stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .db-stat-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid;
  }

  .c-total   .db-stat-icon-wrap { background: var(--cyan-dim);         border-color: rgba(0,229,255,0.2);  }
  .c-threats .db-stat-icon-wrap { background: rgba(255,77,109,0.08);   border-color: rgba(255,77,109,0.2); }
  .c-caution .db-stat-icon-wrap { background: rgba(255,183,3,0.08);    border-color: rgba(255,183,3,0.2);  }
  .c-safe    .db-stat-icon-wrap { background: rgba(6,214,160,0.08);    border-color: rgba(6,214,160,0.2);  }

  .db-stat-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid;
  }

  .c-total   .db-stat-tag { color: var(--cyan);   background: var(--cyan-dim);        border-color: rgba(0,229,255,0.18); }
  .c-threats .db-stat-tag { color: var(--danger); background: rgba(255,77,109,0.07);  border-color: rgba(255,77,109,0.18); }
  .c-caution .db-stat-tag { color: var(--warn);   background: rgba(255,183,3,0.07);   border-color: rgba(255,183,3,0.18); }
  .c-safe    .db-stat-tag { color: var(--safe);   background: rgba(6,214,160,0.07);   border-color: rgba(6,214,160,0.18); }

  .db-stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 2.6rem;
    font-weight: 800;
    color: #e8f0fe;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .db-stat-label {
    font-size: 0.82rem;
    color: var(--text-dim);
    margin-top: -4px;
  }

  .db-mini-bar-track {
    height: 3px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
  }

  .db-mini-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 1.2s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .c-threats .db-mini-bar-fill { background: var(--danger); }
  .c-caution .db-mini-bar-fill { background: var(--warn); }
  .c-safe    .db-mini-bar-fill { background: var(--safe); }
  .c-total   .db-mini-bar-fill { background: var(--cyan); }

  /* ── Bottom grid: category radar + recent feed ── */
  .db-bottom-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  @media (max-width: 900px) { .db-bottom-grid { grid-template-columns: 1fr; } }

  /* ── Category breakdown radar card ───────────── */
  .db-radar-card {
    padding: 0 0 20px;
    opacity: 0;
    transform: translateY(14px);
    animation: db-rise 0.5s ease forwards;
    animation-delay: 0.38s;
  }

  .db-cat-legend {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    padding: 0 20px;
    margin-top: 4px;
  }

  .db-cat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
  }

  .db-cat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .db-cat-score {
    margin-left: auto;
    font-weight: 600;
    color: var(--text);
  }

  /* ── Recent scans feed ────────────────────────── */
  .db-feed-card {
    padding: 0;
    opacity: 0;
    transform: translateY(14px);
    animation: db-rise 0.5s ease forwards;
    animation-delay: 0.42s;
  }

  .db-feed-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px 14px;
    border-bottom: 1px solid var(--border);
  }

  .db-feed-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .db-feed-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--cyan);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.15s;
  }

  .db-feed-link:hover { opacity: 0.7; }

  .db-feed-empty {
    padding: 40px 22px;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.08em;
  }

  .db-feed-row {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }

  .db-feed-row:last-child { border-bottom: none; }
  .db-feed-row:hover { background: rgba(0,229,255,0.03); }

  .db-feed-row-main {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 12px;
    align-items: center;
    padding: 13px 22px;
    cursor: pointer;
  }

  .db-feed-url {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-feed-url a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s;
  }

  .db-feed-url a:hover { color: var(--cyan); }

  .db-feed-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    white-space: nowrap;
    border: 1px solid;
  }

  .db-feed-badge.critical { background: rgba(255,77,109,0.12);  color: var(--danger); border-color: rgba(255,77,109,0.25); }
  .db-feed-badge.high     { background: rgba(255,140,66,0.10);  color: var(--high);   border-color: rgba(255,140,66,0.22); }
  .db-feed-badge.warning  { background: rgba(255,183,3,0.10);   color: var(--warn);   border-color: rgba(255,183,3,0.22); }
  .db-feed-badge.safe     { background: rgba(6,214,160,0.08);   color: var(--safe);   border-color: rgba(6,214,160,0.18); }

  .db-feed-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    text-align: right;
    min-width: 28px;
  }

  .db-feed-expand-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }

  .db-feed-expand-btn:hover { color: var(--cyan); }

  /* ── Reasoning panel (expandable) ────────────── */
  .db-reasoning-panel {
    border-top: 1px solid var(--border);
    padding: 14px 22px 16px;
    background: var(--navy-3);
  }

  .db-reasoning-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 10px;
  }

  .db-reasoning-factors {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .db-factor-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px;
    color: var(--text);
    line-height: 1.45;
  }

  .db-factor-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--danger);
    flex-shrink: 0;
    margin-top: 5px;
  }

  .db-factor-pts {
    margin-left: auto;
    white-space: nowrap;
    font-size: 10px;
    color: var(--danger);
    font-weight: 600;
    padding-left: 12px;
  }

  /* ── Category breakdown bar card ─────────────── */
  .db-catbar-card {
    opacity: 0;
    transform: translateY(14px);
    animation: db-rise 0.5s ease forwards;
    animation-delay: 0.48s;
    padding: 0 0 22px;
    margin-bottom: 20px;
  }

  .db-catbar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 16px 22px 0;
  }

  @media (max-width: 700px) { .db-catbar-grid { grid-template-columns: 1fr 1fr; } }

  .db-catbar-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .db-catbar-head {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .db-catbar-avg {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.7rem;
    letter-spacing: -0.02em;
    line-height: 1;
    color: #e8f0fe;
  }

  .db-catbar-track {
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  .db-catbar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 1.3s cubic-bezier(0.25, 1, 0.5, 1);
  }

  /* ── Empty / loading states ───────────────────── */
  .db-state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 340px;
    text-align: center;
    color: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
  }

  .db-no-data-cta {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 8px;
    padding: 10px 18px;
    background: var(--cyan);
    color: var(--navy);
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.82rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.16s, box-shadow 0.16s;
  }

  .db-no-data-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,229,255,0.25);
  }

  /* ── Keyframes ────────────────────────────────── */
  @keyframes db-rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Palette for donut ────────────────────────────────────────────────────────
const PIE_COLORS = {
  Safe:     "#06d6a0",
  Warning:  "#ffb703",
  High:     "#ff8c42",
  Critical: "#ff4d6d",
};

// ─── Category colours ─────────────────────────────────────────────────────────
const CAT_META = {
  lexical:    { label: "Lexical",    color: "#00e5ff", icon: Globe },
  ssl:        { label: "SSL/TLS",    color: "#06d6a0", icon: Lock },
  reputation: { label: "Reputation", color: "#ff8c42", icon: ShieldAlert },
  content:    { label: "Content",    color: "#ff4d6d", icon: FileSearch },
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="db-tooltip">
      <div className="db-tooltip-label">{name}</div>
      <div style={{ color: PIE_COLORS[name], fontWeight: 600 }}>{value} scan{value !== 1 ? "s" : ""}</div>
    </div>
  );
};

// ─── Animated counter hook ────────────────────────────────────────────────────
const useCountUp = (target, duration = 900) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const steps = 40;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(current));
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
};

// ─── Animated bar width hook ──────────────────────────────────────────────────
const useBarWidth = (pct, delay = 300) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay);
    return () => clearTimeout(t);
  }, [pct]);
  return w;
};

// ─── Single stat card ─────────────────────────────────────────────────────────
const StatCard = ({ colorClass, icon, tag, value, label, pct }) => {
  const animated = useCountUp(value);
  const barWidth = useBarWidth(pct);

  return (
    <div className={`db-card db-stat-card ${colorClass}`}>
      <div className="db-stat-top">
        <div className="db-stat-icon-wrap">{icon}</div>
        <span className="db-stat-tag">{tag}</span>
      </div>
      <div>
        <div className="db-stat-num">{animated}</div>
        <div className="db-stat-label">{label}</div>
      </div>
      <div className="db-mini-bar-track">
        <div className="db-mini-bar-fill" style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  );
};

// ─── Category breakdown card (averaged across all scans) ─────────────────────
const CategoryBreakdownCard = ({ history }) => {
  const scansWithBreakdown = history.filter(s => s.details?.category_breakdown);
  if (scansWithBreakdown.length === 0) return null;

  const avg = (key) => {
    const sum = scansWithBreakdown.reduce((acc, s) => acc + (s.details.category_breakdown[key] || 0), 0);
    return Math.round(sum / scansWithBreakdown.length);
  };

  const cats = ["lexical", "ssl", "reputation", "content"];
  const avgs = cats.map(k => ({ key: k, val: avg(k) }));
  const maxVal = Math.max(...avgs.map(c => c.val), 1);

  return (
    <div className="db-card db-catbar-card">
      <div className="db-card-label">// avg risk by category · {scansWithBreakdown.length} scans</div>
      <div className="db-catbar-grid">
        {avgs.map(({ key, val }) => {
          const meta = CAT_META[key];
          const Icon = meta.icon;
          return (
            <CatBar key={key} meta={meta} val={val} maxVal={maxVal} Icon={Icon} />
          );
        })}
      </div>
    </div>
  );
};

// needs to be a sub-component so hook runs per-item
const CatBar = ({ meta, val, maxVal, Icon }) => {
  const fillW = useBarWidth(Math.round((val / maxVal) * 100), 400);
  return (
    <div className="db-catbar-col">
      <div className="db-catbar-head">
        <Icon size={11} color={meta.color} />
        {meta.label}
      </div>
      <div className="db-catbar-avg" style={{ color: meta.color }}>{val}</div>
      <div className="db-catbar-track">
        <div className="db-catbar-fill" style={{ width: `${fillW}%`, background: meta.color }} />
      </div>
    </div>
  );
};

// ─── Feed row with expandable reasoning ───────────────────────────────────────
const FeedRow = ({ scan, tierClass, tierLabel, tierIcon, score }) => {
  const [expanded, setExpanded] = useState(false);
  const reasoning = scan.reasoning || [];

  // Parse factor string like "SSL cert invalid (+65)" → text + pts
  const parseFactor = (f) => {
    const match = f.match(/^(.*?)(\s*\(\+\d+\))$/);
    if (match) return { text: match[1].trim(), pts: match[2].trim() };
    return { text: f, pts: null };
  };

  return (
    <div className="db-feed-row">
      <div className="db-feed-row-main" onClick={() => reasoning.length > 0 && setExpanded(e => !e)}>
        <div className="db-feed-url">
          <a href={scan.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
            {scan.url}
          </a>
        </div>
        <span className={`db-feed-badge ${tierClass}`}>
          {tierIcon}
          {tierLabel}
        </span>
        <span className="db-feed-score">{score}</span>
        {reasoning.length > 0 && (
          <button className="db-feed-expand-btn">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
      </div>

      {expanded && reasoning.length > 0 && (
        <div className="db-reasoning-panel">
          <div className="db-reasoning-label">// risk factors</div>
          <div className="db-reasoning-factors">
            {reasoning.map((f, i) => {
              const { text, pts } = parseFactor(f);
              return (
                <div className="db-factor-item" key={i}>
                  <div className="db-factor-dot" />
                  <span>{text}</span>
                  {pts && <span className="db-factor-pts">{pts}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Verdict helpers (aligned to scoring.py tiers) ───────────────────────────
// scoring.py: CRITICAL ≥75 | HIGH ≥50 | WARNING ≥25 | SAFE <25
const tierClassOf = (score) => {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "warning";
  return "safe";
};

const tierLabelOf = (scan) => {
  // Prefer backend verdict string, normalise casing
  if (scan.verdict) {
    const v = scan.verdict.toUpperCase();
    if (["CRITICAL","HIGH","WARNING","SAFE"].includes(v)) return v;
  }
  const s = scan.risk_score;
  if (s >= 75) return "CRITICAL";
  if (s >= 50) return "HIGH";
  if (s >= 25) return "WARNING";
  return "SAFE";
};

const tierIconOf = (score) => {
  if (score >= 75) return <XOctagon size={10} />;
  if (score >= 50) return <AlertTriangle size={10} />;
  if (score >= 25) return <AlertTriangle size={10} />;
  return <ShieldCheck size={10} />;
};

// ─── Main component ───────────────────────────────────────────────────────────
const Dashboard = ({ token, onRequestLogin }) => {
  const navigate = useNavigate();
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activePie, setActivePie] = useState(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e0a5'},body:JSON.stringify({sessionId:'30e0a5',runId:'pre-fix',hypothesisId:'A',location:'Dashboard.jsx:useEffect(token-check)',message:'Dashboard token check',data:{hasToken:!!token,tokenType:typeof token},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!token) {
      onRequestLogin("Login to view your dashboard");
      navigate("/");
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e0a5'},body:JSON.stringify({sessionId:'30e0a5',runId:'pre-fix',hypothesisId:'C',location:'Dashboard.jsx:load(start)',message:'Dashboard fetchHistory start',data:{hasToken:!!token,tokenLen:typeof token==='string'?token.length:null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        const data = await fetchHistory(token);
        // #region agent log
        fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e0a5'},body:JSON.stringify({sessionId:'30e0a5',runId:'pre-fix',hypothesisId:'B',location:'Dashboard.jsx:load(success)',message:'Dashboard fetchHistory success (shape)',data:{isArray:Array.isArray(data),type:typeof data,keys:(data&&typeof data==='object')?Object.keys(data).slice(0,10):null,len:Array.isArray(data)?data.length:null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setHistory(data);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e0a5'},body:JSON.stringify({sessionId:'30e0a5',runId:'pre-fix',hypothesisId:'C',location:'Dashboard.jsx:load(catch)',message:'Dashboard fetchHistory error',data:{name:err?.name,message:err?.message,status:err?.response?.status,code:err?.code,hasResponse:!!err?.response},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (err.response?.status === 401) {
          onRequestLogin("Session expired — please login again");
          navigate("/");
        } else {
          setError("Failed to load history data.");
        }
      } finally {
        // #region agent log
        fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e0a5'},body:JSON.stringify({sessionId:'30e0a5',runId:'pre-fix',hypothesisId:'D',location:'Dashboard.jsx:load(finally)',message:'Dashboard load finally',data:{setLoadingTo:false},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // ── Thresholds aligned to scoring.py ──
  // #region agent log
  fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30e0a5'},body:JSON.stringify({sessionId:'30e0a5',runId:'pre-fix',hypothesisId:'B',location:'Dashboard.jsx:render(calc)',message:'Dashboard render calc inputs',data:{historyIsArray:Array.isArray(history),historyLen:Array.isArray(history)?history.length:null,historyType:typeof history},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const total    = history.length;
  const critical = history.filter(s => s.risk_score >= 75).length;
  const high     = history.filter(s => s.risk_score >= 50 && s.risk_score < 75).length;
  const warning  = history.filter(s => s.risk_score >= 25 && s.risk_score < 50).length;
  const safe     = history.filter(s => s.risk_score < 25).length;
  const threats  = critical + high; // combined high-risk count for stat card

  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const pieData = [
    { name: "Safe",     value: safe     },
    { name: "Warning",  value: warning  },
    { name: "High",     value: high     },
    { name: "Critical", value: critical },
  ].filter(d => d.value > 0);

  const recent = [...history]
    .sort((a, b) => new Date(b.scan_time) - new Date(a.scan_time))
    .slice(0, 6);

  // ── Loading
  if (loading) return (
    <>
      <FontLoader />
      <style>{styles}</style>
      <div className="db-root">
        <div className="db-grid-bg" />
        <div className="db-content">
          <div className="db-state-box">
            <Loader2 size={28} style={{ color: "var(--cyan)", animation: "spin 1s linear infinite" }} />
            <span>// LOADING DASHBOARD</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );

  // ── Error
  if (error) return (
    <>
      <FontLoader />
      <style>{styles}</style>
      <div className="db-root">
        <div className="db-grid-bg" />
        <div className="db-content">
          <div className="db-state-box" style={{ color: "var(--danger)" }}>
            <XOctagon size={28} />
            <span>{error}</span>
          </div>
        </div>
      </div>
    </>
  );

  // ── No data
  if (total === 0) return (
    <>
      <FontLoader />
      <style>{styles}</style>
      <div className="db-root">
        <div className="db-grid-bg" />
        <div className="db-content">
          <div className="db-header">
            <div className="db-header-left">
              <div className="db-eyebrow"><span className="db-eyebrow-dot" /> Security Overview</div>
              <h1 className="db-title">Your <span>Dashboard</span></h1>
            </div>
          </div>
          <div className="db-card db-state-box" style={{ minHeight: 420 }}>
            <Lock size={32} style={{ color: "var(--cyan)", opacity: 0.5 }} />
            <div>
              <div style={{ color: "var(--text)", marginBottom: 6, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
                No scans yet
              </div>
              <div>Run your first analysis to populate this dashboard.</div>
            </div>
            <button className="db-no-data-cta" onClick={() => navigate("/scan")}>
              <Search size={14} /> Analyze a URL <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── Full dashboard
  return (
    <>
      <FontLoader />
      <style>{styles}</style>

      <div className="db-root">
        <div className="db-grid-bg" />

        <div className="db-content">

          {/* ── Page header ─────────────────────────────── */}
          <div className="db-header">
            <div className="db-header-left">
              <div className="db-eyebrow">
                <span className="db-eyebrow-dot" />
                Security Overview · {total} scans total
              </div>
              <h1 className="db-title">Your <span>Dashboard</span></h1>
            </div>
            <div className="db-header-actions">
              <button className="db-action-btn ghost" onClick={() => navigate("/history")}>
                <History size={14} /> History
              </button>
              <button className="db-action-btn primary" onClick={() => navigate("/scan")}>
                <Search size={14} /> New Scan
              </button>
            </div>
          </div>

          {/* ── Main: Donut | Stats 2×2 ─────────────────── */}
          <div className="db-main-grid">

            {/* Donut chart */}
            <div className="db-card db-chart-card">
              <div className="db-card-label">// threat distribution</div>
              <div className="db-chart-inner">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={72} outerRadius={106}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      onMouseEnter={(_, i) => setActivePie(i)}
                      onMouseLeave={() => setActivePie(null)}
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[entry.name]}
                          opacity={activePie === null || activePie === i ? 1 : 0.35}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="db-donut-center">
                  <div className="db-donut-big">{total}</div>
                  <div className="db-donut-sub">Total Scans</div>
                </div>
              </div>
              <div className="db-legend">
                {pieData.map(d => (
                  <div className="db-legend-item" key={d.name}>
                    <div className="db-legend-swatch" style={{ background: PIE_COLORS[d.name] }} />
                    {d.name}
                    <span className="db-legend-count">({d.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2×2 stat cards */}
            <div className="db-stats-grid">
              <StatCard
                colorClass="c-total"
                icon={<Activity size={16} color="#00e5ff" />}
                tag="ALL TIME"
                value={total}
                label="Total Scans"
                pct={100}
              />
              <StatCard
                colorClass="c-threats"
                icon={<XOctagon size={16} color="#ff4d6d" />}
                tag="HIGH + CRITICAL"
                value={threats}
                label="Threats Detected"
                pct={pct(threats)}
              />
              <StatCard
                colorClass="c-caution"
                icon={<AlertTriangle size={16} color="#ffb703" />}
                tag="WARNING"
                value={warning}
                label="Flagged for Review"
                pct={pct(warning)}
              />
              <StatCard
                colorClass="c-safe"
                icon={<ShieldCheck size={16} color="#06d6a0" />}
                tag="VERIFIED SAFE"
                value={safe}
                label="Clean Links"
                pct={pct(safe)}
              />
            </div>
          </div>

          {/* ── Category breakdown card ───────────────────── */}
          <CategoryBreakdownCard history={history} />

          {/* ── Recent scans feed ────────────────────────── */}
          <div className="db-card db-feed-card">
            <div className="db-feed-header">
              <span className="db-feed-title">// recent activity · click row to expand risk factors</span>
              <button className="db-feed-link" onClick={() => navigate("/history")}>
                View all <ArrowRight size={11} />
              </button>
            </div>

            {recent.length === 0 ? (
              <div className="db-feed-empty">// no recent scans</div>
            ) : (
              recent.map(scan => (
                <FeedRow
                  key={scan.id}
                  scan={scan}
                  tierClass={tierClassOf(scan.risk_score)}
                  tierLabel={tierLabelOf(scan)}
                  tierIcon={tierIconOf(scan.risk_score)}
                  score={scan.risk_score}
                />
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;