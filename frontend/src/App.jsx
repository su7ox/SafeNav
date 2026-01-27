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

  const handleScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/v1/scan', { url });
      setResult(response.data);
    } catch (error) {
      alert("Scan failed. Ensure the backend is running at http://localhost:8000");
    }
    setLoading(false);
  };

  const getVerdict = (score) => {
    if (score <= 30) return { color: 'text-green-600', icon: <ShieldCheck className="w-10 h-10" />, label: 'Safe to Visit' };
    if (score <= 69) return { color: 'text-yellow-600', icon: <AlertTriangle className="w-10 h-10" />, label: 'Caution Advised' };
    return { color: 'text-red-600', icon: <XOctagon className="w-10 h-10" />, label: 'High Risk Detected' };
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-12 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-xl">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-800">SafeNav</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500">
            <Moon size={22} className="cursor-pointer hover:text-slate-800" />
            <User size={22} className="cursor-pointer hover:text-slate-800" />
          </div>
        </nav>

        {/* Hero Search Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-8 tracking-tight italic">
            Scan any type of URL/Links here and Get <br/> to Know all Possible Results
          </h1>
          <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-3 justify-center max-w-2xl mx-auto">
            <input 
              type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="type/paste link here"
              className="flex-1 border-2 border-slate-300 rounded-xl px-6 py-4 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-inner bg-white"
            />
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : 'SCAN'}
            </button>
          </form>
        </section>

        {/* The Dashboard Result Card */}
        {result && (
          <div className="bg-white border-4 border-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
            
            {/* Header / Verdict Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 border-b-2 border-slate-100 pb-10">
              <div className="flex items-center gap-5">
                <div className={getVerdict(result.risk_score).color}>
                  {getVerdict(result.risk_score).icon}
                </div>
                <div>
                  <h2 className={`text-4xl font-black italic uppercase leading-none ${getVerdict(result.risk_score).color}`}>
                    {getVerdict(result.risk_score).label}
                  </h2>
                  <div className="flex items-center gap-2 mt-3 text-slate-400 font-bold">
                    <Globe size={16} />
                    <span className="text-sm">Domain: <b className="text-slate-600">{result.hostname}</b></span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-10 py-5 rounded-3xl border-2 border-slate-100 text-center min-w-[180px]">
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-[0.2em] mb-1">Risk Score</p>
                <p className={`text-6xl font-black ${getVerdict(result.risk_score).color}`}>
                  {result.risk_score}<span className="text-2xl text-slate-300">/100</span>
                </p>
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="mb-12 bg-blue-50/50 p-8 rounded-3xl border-2 border-blue-100 italic text-slate-500 relative">
              <span className="absolute -top-4 left-8 bg-white px-4 py-1 text-xs font-black text-blue-500 uppercase tracking-widest border-2 border-blue-100 rounded-full">About this URL</span>
              <p className="text-lg leading-relaxed font-medium">
                "here it will write ai summry what is url/link is about. To use this feature login ."
              </p>
            </div>

            {/* Data Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
              {/* Left Column: Heuristics */}
              <div className="space-y-6">
                <DataRow label="Spamming Domain" value={result.risk_score > 70 ? "High" : "Low"} />
                <DataRow label="Phishing Domain" value={result.details?.lexical?.typosquat_target ? "Yes" : "No"} />
                <DataRow label="Suspicious" value={result.reasoning.length > 0 ? "Yes" : "No"} />
                <DataRow label="DNS A Records" value="Resolved" />
                <DataRow label="Domain Trust Rating" value={result.risk_score < 30 ? "High" : "Low"} />
              </div>
              
              {/* Right Column: Technical Stats */}
              <div className="space-y-6">
                <DetailRow icon={<ListTree size={18}/>} label="No. of redirects" value={result.details?.trace?.hop_count || 0} />
                <DetailRow icon={<Lock size={18}/>} label="ssl test results" value={result.details?.ssl?.issuer || "Insecure"} />
                <DetailRow icon={<History size={18}/>} label="Domain history" value={`${result.details?.reputation?.domain_age_days || "Unknown"} Days`} />
                <DetailRow icon={<Activity size={18}/>} label="HTTP Status Code" value="200 OK" />
                <DetailRow icon={<FileText size={18}/>} label="Page Size" value="N/A" />
              </div>
            </div>

            {/* Final CTA */}
            <div className="mt-14 text-center">
              <button className="px-16 py-4 bg-white text-slate-400 border-2 border-slate-200 rounded-2xl font-black hover:border-slate-800 hover:text-slate-800 transition-all uppercase tracking-widest text-xs">
                For Deep Scan Click Here, (Login Required)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components for Data rows
const DataRow = ({ label, value }) => (
  <div className="flex justify-between items-center border-b-2 border-slate-50 pb-3">
    <span className="text-md font-black text-slate-800 uppercase tracking-tighter">{label}:</span>
    <span className="text-md font-bold text-slate-500">{value}</span>
  </div>
);

const DetailRow = ({ icon, label, value }) => (
  <div className="flex justify-between items-center border-b-2 border-slate-50 pb-3">
    <div className="flex items-center gap-3 text-slate-800">
      {icon}
      <span className="text-md font-black uppercase tracking-tighter">{label}:</span>
    </div>
    <span className="text-md font-bold text-slate-500">{value}</span>
  </div>
);

export default App;