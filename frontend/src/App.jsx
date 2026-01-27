import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Lock, Activity, Search, Server, Share2, 
  CheckCircle2, LayoutDashboard, History, Settings, 
  Menu, X, Trash2
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'history'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentScans, setRecentScans] = useState([]);

  // Load history from local storage on boot
  useEffect(() => {
    const saved = localStorage.getItem('safenav_history');
    if (saved) setRecentScans(JSON.parse(saved));
  }, []);

  const addToHistory = (scanResult) => {
    const newEntry = {
      id: Date.now(),
      url: scanResult.url, 
      score: scanResult.risk_score,
      verdict: scanResult.verdict,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newEntry, ...recentScans].slice(0, 15); // Keep last 15
    setRecentScans(updated);
    localStorage.setItem('safenav_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setRecentScans([]);
    localStorage.removeItem('safenav_history');
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-50 font-sans overflow-hidden">
      
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-6 space-y-8 z-20">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-blue-600/20 p-2 rounded-lg ring-1 ring-blue-500/30">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
          </div>
          <span className="text-xl font-bold tracking-tight">Safe<span className="text-blue-500">Nav</span></span>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Scanner" 
            active={activeTab === 'scan'} 
            onClick={() => setActiveTab('scan')} 
          />
          <NavItem 
            icon={<History />} 
            label="Recent History" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</p>
          </div>
          <NavItem 
            icon={<Settings />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => {}} 
          />
        </nav>

        {/* Mini Stat */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 font-medium uppercase">Total Scans Run</p>
          <p className="text-3xl font-bold text-white mt-1">{recentScans.length}</p>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur z-30">
          <div className="flex items-center gap-2">
             <ShieldCheck className="w-6 h-6 text-blue-500" />
             <span className="font-bold text-lg">SafeNav</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-0 bg-slate-900 z-20 p-6 space-y-4">
             <NavItem icon={<LayoutDashboard />} label="Scanner" active={activeTab === 'scan'} onClick={() => {setActiveTab('scan'); setMobileMenuOpen(false)}} />
             <NavItem icon={<History />} label="History" active={activeTab === 'history'} onClick={() => {setActiveTab('history'); setMobileMenuOpen(false)}} />
          </div>
        )}

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
           {/* Background Gradient */}
           <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-600/5 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2"></div>

           <div className="max-w-5xl mx-auto relative z-10">
             {activeTab === 'scan' ? (
               <ScannerView onScanComplete={addToHistory} />
             ) : (
               <HistoryView scans={recentScans} onClear={clearHistory} />
             )}
           </div>
        </div>
      </main>

    </div>
  );
};

// --- View Components ---

const ScannerView = ({ onScanComplete }) => {
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
    <div className="space-y-8 animate-fade-in-down pb-20">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Threat Scanner</h2>
        <p className="text-slate-400">Enter a URL below to analyze its safety using our ML engine and heuristic scanners.</p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleScan} className="relative group max-w-3xl">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
        <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl">
          <Globe className="ml-3 text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com" 
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 px-4 py-3 outline-none text-lg"
          />
          <button 
            type="submit" 
            disabled={loading || !url}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Scan Now'}
          </button>
        </div>
        {error && <p className="text-red-400 mt-3 text-sm flex items-center gap-2 font-medium bg-red-400/10 p-2 rounded-lg border border-red-400/20"><AlertTriangle className="w-4 h-4"/> {error}</p>}
      </form>

      {/* Results Display */}
      {result && (
        <div className="space-y-6 animate-fade-in-up">
           <VerdictCard score={result.risk_score} verdict={result.verdict} />
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                   <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                     <Activity className="w-4 h-4" /> Security Analysis
                   </h3>
                   <div className="space-y-3">
                      {result.reasoning?.map((r, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="font-medium">{r}</span>
                        </div>
                      ))}
                      {(!result.reasoning || result.reasoning.length === 0) && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          <p className="text-emerald-400 text-sm font-medium">
                            No active threats or malicious patterns were detected by the engine.
                          </p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <DetailCard label="Redirect Hops" value={result.details?.hop_count || 0} icon={<Server className="w-5 h-5 text-indigo-400"/>} />
                   <DetailCard label="SSL Age" value={result.details?.cert_age ? `${result.details.cert_age} Days` : 'N/A'} icon={<Lock className="w-5 h-5 text-rose-400"/>} />
                </div>
             </div>

             <div className="space-y-4">
               {/* Gauge Card */}
               <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
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
                      <span className="text-4xl font-black text-white">{result.risk_score}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Risk Score</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-400 font-medium bg-slate-700/30 px-3 py-1 rounded-full">
                      ML Confidence: {(result.details?.ml_probability * 100 || 0).toFixed(1)}%
                    </div>
                  </div>
               </div>
               
               {/* Destination Card */}
               <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 break-all">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-2">Final Destination</div>
                  <div className="text-blue-400 text-sm font-mono flex items-start gap-2">
                    <Share2 className="w-4 h-4 mt-0.5 shrink-0" />
                    {result.final_destination}
                  </div>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const HistoryView = ({ scans, onClear }) => (
  <div className="space-y-6 animate-fade-in-down pb-20">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Recent Scans</h2>
        <p className="text-slate-400">Local history of your last 15 security checks.</p>
      </div>
      {scans.length > 0 && (
        <button 
          onClick={onClear} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors border border-slate-700"
        >
          <Trash2 className="w-4 h-4" /> Clear Log
        </button>
      )}
    </div>

    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
      {scans.length === 0 ? (
        <div className="p-20 text-center text-slate-500 flex flex-col items-center">
          <div className="bg-slate-800 p-4 rounded-full mb-4">
            <History className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-lg font-medium">No scan history available</p>
          <p className="text-sm">Run a new scan to see it appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-5">Target URL</th>
                <th className="p-5">Time Scanned</th>
                <th className="p-5">Verdict</th>
                <th className="p-5 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-700/20 transition-colors group cursor-default">
                  <td className="p-5 font-mono text-blue-400 truncate max-w-[250px] group-hover:text-blue-300">
                    {scan.url}
                  </td>
                  <td className="p-5 text-slate-400">{scan.date}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      scan.score > 70 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 
                      scan.score > 30 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {scan.verdict}
                    </span>
                  </td>
                  <td className="p-5 text-right font-bold text-slate-200">{scan.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

// --- Subcomponents ---

const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    {React.cloneElement(icon, { size: 18, className: active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300' })}
    <span className="font-medium text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
  </button>
);

const VerdictCard = ({ score, verdict }) => {
  let theme = { bg: 'bg-emerald-600', border: 'border-emerald-500', icon: <ShieldCheck className="w-8 h-8" /> };
  
  if (score > 70) {
    theme = { bg: 'bg-rose-600', border: 'border-rose-500', icon: <XOctagon className="w-8 h-8" /> };
  } else if (score > 30) {
    theme = { bg: 'bg-amber-500', border: 'border-amber-500', icon: <AlertTriangle className="w-8 h-8" /> };
  }

  return (
    <div className={`${theme.bg} rounded-xl p-8 shadow-xl relative overflow-hidden flex items-center justify-between border-t border-white/10`}>
       {/* Decorative Pattern */}
       <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12 scale-150 pointer-events-none">
         {theme.icon}
       </div>
       
       <div className="relative z-10 text-white">
         <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {theme.icon}
            </div>
            <span className="text-sm font-bold opacity-90 uppercase tracking-widest">System Verdict</span>
         </div>
         <h2 className="text-4xl font-black uppercase tracking-tight">{verdict}</h2>
         <p className="text-white/90 text-sm font-medium mt-1 opacity-80">Target analyzed successfully.</p>
       </div>
    </div>
  );
};

const DetailCard = ({ label, value, icon }) => (
  <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800/60 transition-colors">
    <div>
      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-200">{value}</div>
    </div>
    <div className="p-3 bg-slate-700/30 rounded-xl">{icon}</div>
  </div>
);

export default App;