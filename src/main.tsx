import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './font.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics.ts'
import { captureAttribution } from './lib/api.ts'

initAnalytics()
captureAttribution()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
