import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles.css'
import './font.css'
import App from './App.tsx'
import './styles/responsive.css'
import { initAnalytics } from './lib/analytics.ts'

// One page remains. Retired paths become `/` before analytics starts, so the first
// pageview is recorded once, as `/`. Query and hash (utm_*, ref) are kept; no history entry is added.
const RETIRED_PATHS = new Set(['/rooms', '/preorder', '/done', '/survey', '/test'])
if (RETIRED_PATHS.has(window.location.pathname.replace(/\/+$/, '') || '/')) {
  window.history.replaceState(window.history.state, '', `/${window.location.search}${window.location.hash}`)
}

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
