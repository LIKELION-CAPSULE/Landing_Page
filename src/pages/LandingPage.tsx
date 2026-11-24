import { useRef, useState } from 'react'
import CallHero, { CallHeader } from '../components/hero/CallHero.tsx'
import ContrastSection from '../components/contrast/ContrastSection.tsx'
import TalkDemo from '../components/demo/TalkDemo.tsx'
import MomentsSection from '../components/moments/MomentsSection.tsx'
import BondSection from '../components/bond/BondSection.tsx'
import MateSection from '../components/mate/MateSection.tsx'
import BetaSection from '../components/beta/BetaSection.tsx'
import Footer from '../components/Footer.tsx'
import { useReveal } from '../hooks/useReveal.ts'
import { useCtaState } from '../hooks/useCtaState.ts'

// Landmarks: fixed site header (banner) / main / footer (contentinfo) are siblings.
export default function LandingPage() {
  const main = useRef<HTMLElement>(null)
  const cta = useCtaState()
  const [headerCtaVisible, setHeaderCtaVisible] = useState(false)
  useReveal(main)
  return <>
    <CallHeader cta={cta} ctaVisible={headerCtaVisible} />
    <main ref={main}><CallHero cta={cta} onHeaderCtaVisibleChange={setHeaderCtaVisible} /><div className="story"><ContrastSection /><TalkDemo /><MomentsSection /><BondSection /><MateSection /><BetaSection /></div></main>
    <Footer />
  </>
}
