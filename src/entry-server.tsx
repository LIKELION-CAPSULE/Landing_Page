// Build-time prerender entry (scripts/prerender.mjs). Renders the same tree as main.tsx so the
// client hydrates it as is; also exports the facts the structured data is built from, so the
// JSON-LD always says exactly what the page shows.
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { BETA_FACTS, FAQ } from './data/beta.ts'
import { MATES } from './data/mates.ts'
import { INSTAGRAM_URL } from './data/social.ts'
import { APP_READY, APP_TARGET } from './lib/cta.ts'

export function render(): string {
  return renderToString(<StrictMode><App /></StrictMode>)
}

export const facts = {
  faq: FAQ.map(item => ({ q: item.q, a: item.a })),
  beta: BETA_FACTS.map(fact => ({ label: fact.label, value: fact.value })),
  mates: MATES.map(mate => ({ id: mate.id, name: mate.fullName, introduction: mate.introduction, rating: mate.rating })),
  instagram: INSTAGRAM_URL,
  email: 'capsulestudywithme@gmail.com',
  // Only a real production app address goes into the structured data.
  appUrl: APP_READY && APP_TARGET ? new URL(APP_TARGET).origin + '/' : null,
}
