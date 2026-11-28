import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles.css'
import './font.css'
import './styles/app-ui.css'
import App, { type Page } from './App.tsx'
import './styles/responsive.css'
import { initAnalytics } from './lib/analytics.ts'

// Required: vercel.json rewrites retired paths to index.html without changing the URL (so
// utm_*/ref survive). Here they become `/` before analytics starts, so the first pageview is
// recorded once, as `/`. Query and hash are kept; no history entry is added.
const RETIRED_PATHS = new Set(['/rooms', '/preorder', '/done', '/survey', '/test'])
if (RETIRED_PATHS.has(window.location.pathname.replace(/\/+$/, '') || '/')) {
  window.history.replaceState(window.history.state, '', `/${window.location.search}${window.location.hash}`)
}

initAnalytics()

const root = document.getElementById('root')!
// dist/404.html marks its root data-page="not-found" (Vercel serves it with status 404 for unknown addresses).
// `vite` dev answers every address with index.html, so there the path decides.
const LANDING_PATHS = new Set(['/', '/index.html', ...RETIRED_PATHS])
const page: Page = root.dataset.page === 'not-found' || (!root.firstElementChild && !LANDING_PATHS.has(window.location.pathname.replace(/(.)\/+$/, '$1')))
  ? 'not-found' : 'landing'
const app = <StrictMode><App page={page} /></StrictMode>
// The build prerenders the page into #root (scripts/prerender.mjs); `vite` dev serves it empty.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
