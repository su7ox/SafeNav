import React, { useState } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Lock, Activity, Search, Server, Share2, 
  CheckCircle2
} from 'lucide-react';

const App = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = 'http://localhost:8000';

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/scan`, { url });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Connection failed. Ensure the backend is running on port 8000.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen text-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* --- Header --- */}
        <div className="flex flex-col items-center text-center space-y-4 animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl ring-1 ring-blue-500/50 mb-2">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Safe<span className="text-blue-500">Nav</span> Intelligence
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Analyze suspicious links using real-time machine learning and static analysis.
          </p>
        </div>

        {/* --- Search Bar --- */}
        <div className="max-w-2xl mx-auto relative group z-10">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <form onSubmit={handleScan} className="relative flex items-center bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-2">
            <Globe className="ml-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to scan (e.g., google.com)..." 
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 text-lg px-4 py-3 outline-none"
            />
            <button 
              type="submit" 
              disabled={loading || !url}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Search className="w-4 h-4" /> Scan</>}
            </button>
          </form>
          {error && <p className="text-red-400 text-center mt-4 font-medium">{error}</p>}
        </div>

        {/* --- Results Section --- */}
        {result && (
          <div className="space-y-8 animate-fade-in-up">
            
            {/* 1. Verdict Banner */}
            <VerdictCard score={result.risk_score} verdict={result.verdict} />

            {/* 2. Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Col: Analysis Summary */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Reasoning Panel */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 h-full">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Analysis Report
                  </h3>
                  
                  {result.reasoning && result.reasoning.length > 0 ? (
                    <div className="space-y-3">
                      {result.reasoning.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-slate-200 font-medium">{reason}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <div>
                        <p className="text-emerald-400 font-bold">No Threats Detected</p>
                        <p className="text-emerald-500/80 text-sm">Static analysis found no obvious malicious patterns.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Score & Technicals */}
              <div className="space-y-6">
                
                {/* Score Card */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                   <div className="relative mb-4">
                     <svg className="w-32 h-32 transform -rotate-90">
                       <circle cx="64" cy="64" r="56" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                       <circle 
                         cx="64" cy="64" r="56" 
                         stroke={result.risk_score > 70 ? '#f43f5e' : result.risk_score > 30 ? '#f59e0b' : '#10b981'} 
                         strokeWidth="8" 
                         fill="transparent" 
                         strokeDasharray={351} 
                         strokeDashoffset={351 - (351 * result.risk_score) / 100} 
                         className="transition-all duration-1000 ease-out"
                       />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                       <span className="text-3xl font-black">{result.risk_score}</span>
                       <span className="text-xs text-slate-500 uppercase font-bold">Risk Score</span>
                     </div>
                   </div>
                   <p className="text-sm text-slate-400">
                     ML Confidence: <span className="text-slate-200 font-bold">
                       {result.details?.ml_probability ? (result.details.ml_probability * 100).toFixed(1) : 0}%
                     </span>
                   </p>
                </div>

                {/* Final URL Card */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Final Destination</h3>
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <Share2 className="w-4 h-4 shrink-0" />
                    <span className="font-mono text-sm truncate w-full block" title={result.final_destination}>
                      {result.final_destination}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Tech Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard 
                  icon={<Server className="w-5 h-5 text-indigo-400" />}
                  label="Redirect Hops" 
                  value={result.details?.hop_count || 0}
                  subtext="Chain Length"
                />
                <InfoCard 
                  icon={<Lock className="w-5 h-5 text-rose-400" />}
                  label="SSL Age" 
                  value={result.details?.cert_age ? `${result.details.cert_age} Days` : "N/A"}
                  subtext="Certificate Validity"
                />
                 <InfoCard 
                  icon={<Globe className="w-5 h-5 text-cyan-400" />}
                  label="URL Length" 
                  value={result.url.length}
                  subtext="Characters"
                />
                 <InfoCard 
                  icon={<Activity className="w-5 h-5 text-emerald-400" />}
                  label="Status" 
                  value="Active"
                  subtext="Server Response"
                />
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

// --- Subcomponents ---

const VerdictCard = ({ score, verdict }) => {
  let theme = { bg: 'bg-emerald-600', icon: <ShieldCheck className="w-12 h-12 text-white" />, text: 'Safe to Access' };
  
  if (score > 70) {
    theme = { bg: 'bg-rose-600', icon: <XOctagon className="w-12 h-12 text-white" />, text: 'High Risk Detected' };
  } else if (score > 30) {
    theme = { bg: 'bg-amber-500', icon: <AlertTriangle className="w-12 h-12 text-white" />, text: 'Caution Advised' };
  }

  return (
    <div className={`${theme.bg} rounded-2xl p-8 shadow-xl shadow-slate-900/20 relative overflow-hidden`}>
       {/* Background Pattern */}
       <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12 scale-150">
         {theme.icon}
       </div>
       
       <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
         <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm shadow-inner">
           {theme.icon}
         </div>
         <div className="text-center md:text-left">
           <h2 className="text-3xl font-black text-white tracking-tight uppercase">{verdict}</h2>
           <p className="text-white/90 font-medium mt-1">Based on static, heuristic, and ML analysis protocols.</p>
         </div>
       </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, subtext }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800 transition-colors group">
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-slate-700/50 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
    </div>
    <div className="text-2xl font-bold text-slate-100">{value}</div>
    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{label}</div>
  </div>
);

export default App;