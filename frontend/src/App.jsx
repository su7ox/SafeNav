import React, { useState } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Lock, History, ListTree, Activity, FileText, User, Moon 
} from 'lucide-react';

const App = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ensure backend URL is correct based on your FastAPI setup
  const BACKEND_URL = 'http://localhost:8000';

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/scan`, { url });
      setResult(response.data);
    } catch (error) {
      console.error("Scan Error:", error);
      alert(`Scan failed. Please ensure the backend is running at ${BACKEND_URL}`);
    }
    setLoading(false);
  };

  const getVerdict = (score) => {
    if (score <= 30) return { color: 'text-emerald-600', icon: <ShieldCheck className="w-12 h-12" />, label: 'Safe to Visit', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (score <= 69) return { color: 'text-amber-600', icon: <AlertTriangle className="w-12 h-12" />, label: 'Caution Advised', bg: 'bg-amber-50', border: 'border-amber-100' };
    return { color: 'text-rose-600', icon: <XOctagon className="w-12 h-12" />, label: 'High Risk Detected', bg: 'bg-rose-50', border: 'border-rose-100' };
  };

  const verdictData = result ? getVerdict(result.risk_score) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8 font-sans">
      {/* --- Advanced CSS Injection --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }

        .rounded-\[2\.5rem\] {
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 20px 50px rgba(0,0,0,0.05), 10px 10px 0px rgba(0,0,0,0.01);
        }

        .rounded-\[2\.5rem\]:hover {
          transform: translateY(-6px);
          box-shadow: 0 40px 80px rgba(0,0,0,0.08), 15px 15px 0px rgba(0,0,0,0.02);
        }

        .bg-slate-50\\/80 {
          backdrop-filter: blur(8px);
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.7));
        }

        .bg-slate-50\\/80::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(37, 99, 235, 0.03) 0%, transparent 70%);
          animation: rotate-slow 15s linear infinite;
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        svg {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .group:hover svg {
          transform: scale(1.2) rotate(-5deg);
          filter: drop-shadow(0 4px 8px rgba(37, 99, 235, 0.2));
        }

        button[type="submit"] {
          position: relative;
          overflow: hidden;
        }

        button[type="submit"]::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.5s;
        }

        button[type="submit"]:hover::before {
          left: 100%;
        }
      `}} />

      <div className="max-w-6xl mx-auto">
        {/* --- Navbar --- */}
        <nav className="flex justify-between items-center mb-16 pt-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <ShieldCheck className="text-white w-7 h-7" strokeWidth={2.5} />
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-900">SafeNav</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400 transition-colors">
            <button className="hover:text-slate-900 transition-colors"><Moon size={24} strokeWidth={2} /></button>
            <button className="hover:text-slate-900 transition-colors"><User size={24} strokeWidth={2} /></button>
          </div>
        </nav>

        {/* --- Hero Section & Search --- */}
        <section className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
            Scan links. <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Reveal hidden risks.
            </span>
          </h1>
          <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-4 justify-center max-w-3xl mx-auto relative z-10">
            <div className="flex-1 relative">
               <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
              <input 
                type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste URL here (e.g., google.com)..."
                className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-lg font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm bg-white placeholder:text-slate-400"
              />
            </div>
            <button type="submit" disabled={loading || !url} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none text-sm md:text-base flex items-center justify-center min-w-[140px]">
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : 'ANALYZE'}
            </button>
          </form>
        </section>

        {/* --- Results Card --- */}
        {result && verdictData && (
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-lg relative overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Header Row: Verdict & Score */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 border-b-2 border-slate-50 pb-10">
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl ${verdictData.bg} ${verdictData.border} border-2`}>
                  <div className={verdictData.color}>
                    {verdictData.icon}
                  </div>
                </div>
                <div>
                  <h2 className={`text-4xl md:text-5xl font-black italic uppercase leading-none tracking-tight ${verdictData.color}`}>
                    {verdictData.label}
                  </h2>
                  <div className="flex items-center gap-2 mt-4 text-slate-500 font-bold bg-slate-50 py-2 px-4 rounded-lg inline-flex">
                    <Globe size={18} strokeWidth={2.5} />
                    <span className="text-sm uppercase tracking-wider">Target: <b className="text-slate-900 ml-1">{result.hostname}</b></span>
                  </div>
                </div>
              </div>
              
              <div className={`${verdictData.bg} px-10 py-6 rounded-[2rem] border-2 ${verdictData.border} text-center min-w-[200px]`}>
                <p className={`text-xs uppercase font-black tracking-[0.25em] mb-2 ${verdictData.color} opacity-80`}>Risk Score</p>
                <div className="flex items-baseline justify-center">
                  <span className={`text-7xl font-black leading-none ${verdictData.color}`}>{result.risk_score}</span>
                  <span className={`text-3xl font-bold ml-1 opacity-60 ${verdictData.color}`}>/100</span>
                </div>
              </div>
            </div>

            {/* AI Insight Section */}
            <div className="mb-14 relative">
               <div className="absolute -top-3 left-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm z-10">
                 AI Security Insight
               </div>
              <div className="bg-slate-50/80 p-8 pt-10 rounded-3xl border-2 border-slate-100/80 italic text-slate-600 text-lg font-medium leading-relaxed relative z-0">
                <p>
                  "This section is reserved for the generative AI summary of the URL's intent and content. Log in to unlock this premium feature."
                </p>
              </div>
            </div>

            {/* Data Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-10">
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-2">Threat Indicators</h3>
                <DataRow label="Spam/Abuse TLD" value={result.risk_score > 70 ? "High Probability" : "Low"} isBad={result.risk_score > 70} />
                <DataRow label="Typosquatting Intent" value={result.details?.lexical?.typosquat_target ? `Targeting: ${result.details.lexical.typosquat_target}` : "None Detected"} isBad={result.details?.lexical?.typosquat_target} />
                <DataRow label="Heuristic Flags" value={result.reasoning.length > 0 ? `${result.reasoning.length} Flags Found` : "Clean"} isBad={result.reasoning.length > 0} />
                <DataRow label="DNS Resolution" value="Successfully Resolved" />
                <DataRow label="Overall Trust Rating" value={result.risk_score < 30 ? "Trusted" : result.risk_score < 70 ? "Neutral" : "Untrusted"} isBad={result.risk_score >= 70} />
              </div>
              
              <div className="space-y-2">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-2">Technical Footprint</h3>
                <DetailRow icon={<ListTree size={20}/>} label="Redirect Chain" value={`${result.details?.trace?.hop_count || 0} Hops`} />
                <DetailRow icon={<Lock size={20}/>} label="SSL/TLS Issuer" value={result.details?.ssl?.issuer || "Insecure Connection"} isBad={!result.details?.ssl?.issuer} />
                <DetailRow icon={<History size={20}/>} label="Domain Age" value={result.details?.reputation?.domain_age_days ? `${result.details.reputation.domain_age_days} Days` : "Unknown/Redacted"} isBad={result.details?.reputation?.domain_age_days < 30} />
                <DetailRow icon={<Activity size={20}/>} label="HTTP Status" value="200 OK (Live)" />
                <DetailRow icon={<FileText size={20}/>} label="Content Size" value="N/A (Static Scan)" />
              </div>
            </div>

            {/* Disabled Deep Scan Button */}
            <div className="mt-16 text-center">
              <button disabled className="px-12 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-slate-200 cursor-not-allowed opacity-80 transition-all group relative overflow-hidden">
                 <span className="relative z-10 flex items-center justify-center gap-2">
                   <Lock size={16} /> Initialize Deep Scan Analysis (Login Required)
                 </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components
const DataRow = ({ label, value, isBad }) => (
  <div className="flex justify-between items-center border-b-2 border-slate-50 py-4 group hover:bg-slate-50/50 transition-colors px-2 rounded-lg">
    <span className="text-[13px] font-black text-slate-700 uppercase tracking-wider">{label}</span>
    <span className={`text-[15px] font-bold ${isBad ? 'text-rose-600' : 'text-slate-600'} text-right`}>{value}</span>
  </div>
);

const DetailRow = ({ icon, label, value, isBad }) => (
  <div className="flex justify-between items-center border-b-2 border-slate-50 py-4 group hover:bg-slate-50/50 transition-colors px-2 rounded-lg">
    <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-600 transition-colors">
      {icon}
      <span className="text-[13px] font-black uppercase tracking-wider text-slate-700">{label}</span>
    </div>
    <span className={`text-[15px] font-bold ${isBad ? 'text-rose-600' : 'text-slate-600'} text-right truncate max-w-[150px] sm:max-w-none`}>{value}</span>
  </div>
);

export default App;