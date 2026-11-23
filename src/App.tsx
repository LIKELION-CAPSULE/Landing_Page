import LandingPage from './pages/LandingPage.tsx'
import { useRoute } from './hooks/useRoute.ts'

export default function App() {
  useRoute()
  return <LandingPage />
}
