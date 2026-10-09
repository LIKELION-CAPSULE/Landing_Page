import LandingPage from './pages/LandingPage.tsx'
import RoomsPage from './pages/RoomsPage.tsx'
import { ROUTES, useRoute } from './hooks/useRoute.ts'

export default function App() {
  const { path, navigate, goBack } = useRoute()

  if (path === ROUTES.rooms) return <RoomsPage onBack={goBack} />
  return <LandingPage onOpenRooms={() => navigate(ROUTES.rooms)} />
}
