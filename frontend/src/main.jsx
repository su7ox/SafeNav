import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// #region agent log
try {
  fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '30e0a5' },
    body: JSON.stringify({
      sessionId: '30e0a5',
      runId: 'pre-fix',
      hypothesisId: 'E',
      location: 'main.jsx:startup',
      message: 'App startup ping',
      data: { href: typeof window !== 'undefined' ? window.location.href : null },
      timestamp: Date.now(),
    }),
    keepalive: true,
  }).catch(() => {})
} catch (_) {}

try {
  window.addEventListener('error', (e) => {
    fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '30e0a5' },
      body: JSON.stringify({
        sessionId: '30e0a5',
        runId: 'pre-fix',
        hypothesisId: 'E',
        location: 'main.jsx:window.error',
        message: 'Global window error',
        data: {
          message: e?.message,
          filename: e?.filename,
          lineno: e?.lineno,
          colno: e?.colno,
        },
        timestamp: Date.now(),
      }),
      keepalive: true,
    }).catch(() => {})
  })

  window.addEventListener('unhandledrejection', (e) => {
    fetch('http://127.0.0.1:7802/ingest/5abc6598-7ccd-4f14-91d0-abc58a73c2ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '30e0a5' },
      body: JSON.stringify({
        sessionId: '30e0a5',
        runId: 'pre-fix',
        hypothesisId: 'E',
        location: 'main.jsx:unhandledrejection',
        message: 'Unhandled promise rejection',
        data: {
          reasonType: typeof e?.reason,
          reasonMessage: e?.reason?.message,
          reasonName: e?.reason?.name,
        },
        timestamp: Date.now(),
      }),
      keepalive: true,
    }).catch(() => {})
  })
} catch (_) {}
// #endregion

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)