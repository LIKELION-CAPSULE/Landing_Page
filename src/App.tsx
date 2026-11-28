import LandingPage from './pages/LandingPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

export type Page = 'landing' | 'not-found'

export default function App({ page = 'landing' }: { page?: Page }) {
  return page === 'not-found' ? <NotFoundPage /> : <LandingPage />
}
