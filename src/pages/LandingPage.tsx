import { useRef } from 'react'
import Hero from '../components/Hero.tsx'
import Problem from '../components/Problem.tsx'
import Steps from '../components/Steps.tsx'
import Rooms from '../components/Rooms.tsx'
import Notice from '../components/Notice.tsx'
import Footer from '../components/Footer.tsx'
import { useReveal } from '../hooks/useReveal.ts'

type Props = {
  onOpenRooms: () => void
}

export default function LandingPage({ onOpenRooms }: Props) {
  const mainRef = useRef<HTMLElement>(null)
  useReveal(mainRef)

  return (
    <main ref={mainRef}>
      {/* 1. Hero (Figma 1:187) */}
      <Hero />

      {/* 2. Story (Figma 1:100) */}
      <div className="story">
        <Problem />
        <Steps />
        <Rooms onOpenRooms={onOpenRooms} />
        <Notice />
        <Footer />
      </div>
    </main>
  )
}
