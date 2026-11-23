// Single source for the UI and Front_Web/.temp/renewal/03-render-demo.mjs.
// Node 24 can import this erasable TypeScript directly; no dialogue copy in scripts.
export type DemoExpression = 'neutral' | 'contempt' | 'laugh' | 'focus' | 'angry' | 'happy' | 'sulky'
export type DemoId = 'long_time' | 'ask' | 'thanks' | 'bye' | 'silence'
export type DemoChipId = Exclude<DemoId, 'silence'>
export type DemoReply = {
  id: DemoId
  chip: string
  dialogue: string
  expressions: { start: DemoExpression; afterEllipsis?: DemoExpression }
  talkMs: number
  clip: string
}

export function speakingTime(dialogue: string) {
  return Math.max(1500, Math.min(4500, Array.from(dialogue.replace(/\s/g, '')).length * 140))
}

const define = (id: DemoId, chip: string, dialogue: string, start: DemoExpression, afterEllipsis?: DemoExpression): DemoReply => ({
  id, chip, dialogue, expressions: { start, ...(afterEllipsis ? { afterEllipsis } : {}) },
  talkMs: speakingTime(dialogue), clip: `demo-${id}`,
})

export const CHAERIN_DEMO: readonly DemoReply[] = [
  define('long_time', '오랜만이야!', '뭐야, 살아 있었네? …딱히 기다린 건 아니거든.', 'contempt', 'laugh'),
  define('ask', '이거 어떻게 해?', '…그거 나도 몰라. 같이 찾아보든가. 너 혼자 끙끙대는 거 보기 답답하니까.', 'focus'),
  define('thanks', '오늘 고마웠어', '뭐래, 갑자기 왜 그래? …뭐 사줄 거 있으면 그냥 말해.', 'angry', 'laugh'),
  define('bye', '나 이제 갈게', '내일도 늦으면 딸기우유 쏘는 거다. …조심히 가.', 'happy'),
  define('silence', '', '…야, 졸아? 모르는 거 있으면 그냥 물어봐. 안 잡아먹어.', 'sulky'),
]
export const DEMO_CHIPS = CHAERIN_DEMO.filter((item): item is DemoReply & { id: DemoChipId } => item.id !== 'silence')
export const DEMO_SILENCE = CHAERIN_DEMO.find(item => item.id === 'silence')!
// S4 draft, pending PM review. Reuse long_time's existing mouth motion and
// speaking duration; this is a subtitle variant, never a new rendered clip.
export const MOMENT_VOICE = {
  status: 'draft_pending_pm' as const,
  clip: 'long_time' as const,
  self: '오늘 마감 드디어 끝냈어!',
  dialogue: '…끝냈다고? 그럼 딸기우유는 네가 사는 거다.',
  talkMs: CHAERIN_DEMO.find(item => item.id === 'long_time')!.talkMs,
}
export const DEMO_TIMING = { delayMs: 400, transitionMs: 300, holdMs: 600, returnMs: 400, fadeMs: 120, silenceMs: 10_000 } as const

export function demoTiming(item: DemoReply) {
  const letters = Array.from(item.dialogue.replace(/\s/g, ''))
  const ellipsis = letters.indexOf('…')
  return {
    talkStartMs: DEMO_TIMING.transitionMs,
    talkEndMs: DEMO_TIMING.transitionMs + item.talkMs,
    turnMs: item.expressions.afterEllipsis && ellipsis >= 0 ? DEMO_TIMING.transitionMs + item.talkMs * ellipsis / letters.length : null,
    durationMs: DEMO_TIMING.transitionMs + item.talkMs + DEMO_TIMING.holdMs + DEMO_TIMING.returnMs,
  }
}
