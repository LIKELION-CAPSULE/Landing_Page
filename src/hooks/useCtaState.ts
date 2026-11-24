import { useEffect, useState } from 'react'
import { ctaState, OPEN_AT, type CtaState } from '../lib/cta.ts'

// setTimeout's longest delay (~24.8 days); longer waits re-arm in steps.
const MAX_DELAY = 2_147_483_647

// One rule for every CTA (header, hero, final): see ctaState() in lib/cta.ts.
export function useCtaState(): CtaState {
  const [cta, setCta] = useState(ctaState)

  useEffect(() => {
    let timer = 0
    const update = () => setCta(ctaState())
    // A timer can fire slightly before OPEN_AT by the wall clock. Re-arm for the
    // remaining time instead of leaving an open page locked until the next tab switch.
    const arm = () => {
      const remaining = OPEN_AT - Date.now()
      if (remaining <= 0) return
      timer = window.setTimeout(() => { update(); arm() }, Math.min(remaining, MAX_DELAY))
    }
    arm()
    document.addEventListener('visibilitychange', update)
    window.addEventListener('popstate', update)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('popstate', update)
    }
  }, [])

  return cta
}
