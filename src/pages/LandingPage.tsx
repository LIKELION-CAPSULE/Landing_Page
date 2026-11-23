import { useRef } from 'react'
import CallHero from '../components/hero/CallHero.tsx'
import ContrastSection from '../components/contrast/ContrastSection.tsx'
import TalkDemo from '../components/demo/TalkDemo.tsx'
import MomentsSection from '../components/moments/MomentsSection.tsx'
import BondSection from '../components/bond/BondSection.tsx'
import MateSection from '../components/mate/MateSection.tsx'
import BetaSection from '../components/beta/BetaSection.tsx'
import Footer from '../components/Footer.tsx'
import { useReveal } from '../hooks/useReveal.ts'

export default function LandingPage() {
  const main = useRef<HTMLElement>(null)
  useReveal(main)
  return <main ref={main}><CallHero /><div className="story"><ContrastSection /><TalkDemo /><MomentsSection /><BondSection /><MateSection /><BetaSection /><Footer /></div></main>
}
