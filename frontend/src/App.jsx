import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, AlertTriangle, XOctagon, Loader2, 
  Globe, Lock, Activity, Search, Server, Share2, 
  CheckCircle2, LayoutDashboard, History, Settings, 
  Menu, X, Trash2, Moon, User
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('scan');
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
    const updated = [newEntry, ...recentScans].slice(0, 15);
    setRecentScans(updated);
    localStorage.setItem('safenav_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setRecentScans([]);
    localStorage.removeItem('safenav_history');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900 font-sans overflow-hidden">
      
      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">SafeNav</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Moon className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <User className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
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
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          Scan links. Reveal hidden risks.
        </h1>
      </div>

      {/* Search Input */}
      <form onSubmit={handleScan} className="max-w-3xl mx-auto">
        <div className="flex items-center bg-white border-2 border-slate-200 rounded-2xl p-3 shadow-lg hover:border-blue-300 transition-colors">
          <Globe className="ml-2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL here (e.g., google.com)..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 px-4 py-3 outline-none"
          />
          <button 
            type="submit" 
            disabled={loading || !url}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wide"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'ANALYZE'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-3 text-sm flex items-center gap-2 font-medium bg-red-50 p-3 rounded-lg border border-red-200"><AlertTriangle className="w-4 h-4"/> {error}</p>}
      </form>

      {/* Results Display */}
      {result && (
        <div className="space-y-6 max-w-4xl mx-auto">
           {/* Main Result Card */}
           <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
             <div className="flex items-start justify-between mb-6">
               <div className="flex items-center gap-4">
                 <div className={`p-4 rounded-2xl ${
                   result.risk_score > 70 ? 'bg-red-100' : 
                   result.risk_score > 30 ? 'bg-yellow-100' : 
                   'bg-green-100'
                 }`}>
                   {result.risk_score > 70 ? <XOctagon className="w-8 h-8 text-red-600" /> :
                    result.risk_score > 30 ? <AlertTriangle className="w-8 h-8 text-yellow-600" /> :
                    <ShieldCheck className="w-8 h-8 text-green-600" />}
                 </div>
                 <div>
                   <h2 className={`text-3xl font-bold uppercase ${
                     result.risk_score > 70 ? 'text-red-600' : 
                     result.risk_score > 30 ? 'text-yellow-600' : 
                     'text-green-600'
                   }`}>
                     {result.verdict}
                   </h2>
                   <p className="text-slate-500 text-sm mt-1">Target: <span className="font-semibold text-slate-700">{result.url}</span></p>
                 </div>
               </div>
               
               <div className="text-right">
                 <div className="text-5xl font-bold text-slate-900">{result.risk_score}<span className="text-2xl text-slate-400">/100</span></div>
                 <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">RISK SCORE</div>
               </div>
             </div>

             {/* AI Security Insight */}
             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
               <div className="flex items-center gap-2 mb-3">
                 <div className="bg-blue-100 p-2 rounded-lg">
                   <Activity className="w-4 h-4 text-blue-600" />
                 </div>
                 <h3 className="font-bold text-slate-900">AI Security Insight</h3>
               </div>
               
               {result.reasoning && result.reasoning.length > 0 ? (
                 <div className="space-y-2">
                   {result.reasoning.map((r, i) => (
                     <p key={i} className="text-sm text-slate-600">{r}</p>
                   ))}
                 </div>
               ) : (
                 <p className="text-sm text-slate-500">
                   Premium features will be found by your fens hiddle messable to get certain with premium features as the linkay. <a href="#" className="text-blue-600 font-semibold hover:underline">Learn more.</a>
                 </p>
               )}
             </div>

             {/* Two Column Layout */}
             <div className="grid grid-cols-2 gap-6 mt-6">
               {/* Threat Indicators */}
               <div>
                 <h3 className="font-bold text-slate-900 mb-4">Threat Indicators</h3>
                 <div className="space-y-3">
                   <IndicatorRow 
                     label="Spam/Abuse TLD:" 
                     value="Low" 
                     valueClass="text-green-600 font-semibold"
                   />
                   <IndicatorRow 
                     label="Typosquatting Intent:" 
                     value="None Detected" 
                     valueClass="text-slate-600"
                   />
                   <IndicatorRow 
                     label="SSL/TLS Cance TLD:" 
                     value="Low" 
                     valueClass="text-green-600 font-semibold"
                   />
                 </div>
               </div>

               {/* Technical Footprint */}
               <div>
                 <h3 className="font-bold text-slate-900 mb-4">Technical Footprint</h3>
                 <div className="space-y-3">
                   <IndicatorRow 
                     label="SSL/TLS Issuer:" 
                     value="Google Trust Services" 
                     valueClass="text-slate-600"
                   />
                   <IndicatorRow 
                     label="Domain Age:" 
                     value="9000+ Days" 
                     valueClass="text-slate-600"
                   />
                   <IndicatorRow 
                     label="Domain Age (nge):" 
                     value="9000+ Days" 
                     valueClass="text-slate-600"
                   />
                 </div>
               </div>
             </div>

             {/* Deep Scan Button */}
             <div className="mt-6">
               <button className="w-full bg-slate-200 text-slate-400 py-4 rounded-xl font-semibold text-sm cursor-not-allowed">
                 Initialize Deep Scan Analysis (Login Required)
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const HistoryView = ({ scans, onClear }) => (
  <div className="space-y-6 pb-20">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Recent Scans</h2>
        <p className="text-slate-600">Local history of your last 15 security checks.</p>
      </div>
      {scans.length > 0 && (
        <button 
          onClick={onClear} 
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-lg text-sm text-slate-700 transition-colors border border-slate-200"
        >
          <Trash2 className="w-4 h-4" /> Clear Log
        </button>
      )}
    </div>

    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
      {scans.length === 0 ? (
        <div className="p-20 text-center text-slate-500 flex flex-col items-center">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <History className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-lg font-medium">No scan history available</p>
          <p className="text-sm">Run a new scan to see it appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-5">Target URL</th>
                <th className="p-5">Time Scanned</th>
                <th className="p-5">Verdict</th>
                <th className="p-5 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                  <td className="p-5 font-mono text-blue-600 truncate max-w-[250px] group-hover:text-blue-700">
                    {scan.url}
                  </td>
                  <td className="p-5 text-slate-600">{scan.date}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      scan.score > 70 ? 'bg-red-100 text-red-600' : 
                      scan.score > 30 ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-green-100 text-green-600'
                    }`}>
                      {scan.verdict}
                    </span>
                  </td>
                  <td className="p-5 text-right font-bold text-slate-900">{scan.score}</td>
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

const IndicatorRow = ({ label, value, valueClass }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-600">{label}</span>
    <span className={`text-sm ${valueClass}`}>{value}</span>
  </div>
);

export default App;