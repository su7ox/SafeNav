import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { analyzeUrl, loginUser, registerUser } from './services/api'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [authError, setAuthError] = useState('')

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const data = await analyzeUrl(url, token)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze URL')
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      if (isLogin) {
        const data = await loginUser(email, password)
        setToken(data.access_token)
        localStorage.setItem('token', data.access_token)
        setShowAuth(false)
      } else {
        await registerUser(email, password)
        setIsLogin(true)
        setAuthError('Registration successful! Please login.')
        return
      }
      // Clear sensitive data
      setEmail('')
      setPassword('')
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Authentication failed')
    }
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('token')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                SafeNav
              </span>
            </div>
            <div>
              {token ? (
                <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
                  Logout
                </button>
              ) : (
                <button 
                  onClick={() => setShowAuth(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Scan links. <span className="text-blue-500">Reveal hidden risks.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Advanced AI-powered phishing detection and URL analysis.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-16">
          <form onSubmit={handleAnalyze} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative flex">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a suspicious URL (e.g., http://example.com)"
                className="w-full bg-gray-800 border-none text-white px-6 py-4 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-r-xl font-semibold text-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'ANALYZE'}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-center">
              {error}
            </div>
          )}
        </div>

        {/* Results Grid */}
        {result && (
          <div className="animate-fade-in space-y-8">
            {/* Main Verdict Card */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-full ${
                    result.verdict === 'Safe' ? 'bg-green-500/10 text-green-400' :
                    result.verdict === 'Suspicious' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{result.verdict}</h2>
                    <p className="text-gray-400 mt-1">Target: <span className="text-blue-400">{result.url}</span></p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">
                    {result.risk_score}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Risk Score</div>
                </div>
              </div>
            </div>

            {/* AI Insight (Guest Locked) */}
            <div className={`relative rounded-2xl p-6 border ${result.is_guest ? 'bg-gray-800/50 border-gray-700 border-dashed' : 'bg-blue-900/20 border-blue-800'}`}>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-100 mb-2">AI Security Insight</h3>
                  <div className="space-y-2">
                    {result.reasoning.map((reason, idx) => (
                      <p key={idx} className={`${result.is_guest ? 'text-gray-500 blur-sm select-none' : 'text-blue-200'}`}>
                        {result.is_guest ? 'This is a hidden insight regarding the security of the URL.' : `• ${reason}`}
                      </p>
                    ))}
                  </div>
                  {result.is_guest && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button 
                        onClick={() => setShowAuth(true)}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-full border border-gray-600 shadow-lg flex items-center gap-2 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Login to view AI Analysis
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DetailCard title="SSL & Security" icon="🔐" data={result.details.ssl_security} />
              <DetailCard title="Phishing Checks" icon="🎣" data={result.details.phishing_checks} />
              <DetailCard title="Domain Reputation" icon="🌐" data={result.details.domain_reputation} />
              <DetailCard title="Link Structure" icon="🔗" data={result.details.link_structure} />
              <DetailCard title="Redirect Analysis" icon="🔄" data={result.details.redirect_analysis} />
              
              {/* --- UPDATED CARD: CONTENT SAFETY --- */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🧾</span>
                  <h3 className="font-semibold text-lg">Content Safety</h3>
                </div>
                <div className="space-y-3 text-sm">
                   {/* CHANGED: Removed Login Detected, Added Dynamic Content */}
                   <div className="flex justify-between">
                    <span className="text-gray-400">Dynamic Content:</span>
                    <span className="font-medium text-white">{result.details.content_safety.dynamic_content || "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scan Status:</span>
                    <span className="font-medium text-gray-300">{result.details.content_safety.status || "Completed"}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 relative">
            <button 
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            
            {authError && (
              <div className="mb-4 p-3 bg-red-900/30 text-red-200 text-sm rounded-lg text-center">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {isLogin ? 'Login' : 'Register'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper Component for Data Cards
function DetailCard({ title, icon, data }) {
  if (!data) return null
  
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="space-y-3 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start">
            <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
            <span className={`font-medium text-right ${
              String(value).toLowerCase().includes('yes') || String(value).toLowerCase().includes('valid') ? 'text-green-400' :
              String(value).toLowerCase().includes('no') ? 'text-gray-300' :
              String(value).toLowerCase().includes('expired') || String(value).toLowerCase().includes('unsafe') ? 'text-red-400' :
              'text-white'
            }`}>
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App