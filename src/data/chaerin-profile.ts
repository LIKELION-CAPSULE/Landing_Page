// S5 (bond) and S6 (mate intro) copy. Source: PM mate sheet for 강채린 (2026-11-24)
// and docs/renewal-2026-11.md §4. Lines marked DRAFT still need PM confirmation.
import neutral from '../assets/mates/chaerin/neutral.webp'
import laugh from '../assets/mates/chaerin/laugh.webp'
import angry from '../assets/mates/chaerin/angry.webp'

export type BondStage = {
  id: string
  name: string
  unlock: string
  // null = locked: the stage is shown as a silhouette, never with its real expression.
  image: string | null
  line: string
  // true = `line` is an unlock notice, not something 채린 says (no speaker label).
  notice?: boolean
}

// Stage names follow PRD §8 (채린 기준). Hours are omitted on purpose: they are
// recommended values that may change after the beta.
export const BOND_STAGES: BondStage[] = [
  { id: 'first', name: '처음 만남', unlock: '기본 표정과 대사', image: neutral, line: '…조용히 해.' },
  { id: 'known', name: '아는 사이', unlock: '웃는 얼굴 · 보이스 대사', image: laugh, line: '뭐 봐? …너도 딸기우유 마실래?' }, // DRAFT
  { id: 'friend', name: '친구', unlock: '장난스러운 짜증 · 보이스 대사', image: angry, line: '야, 그거 내 거거든? …반만 줄게.' }, // DRAFT
  { id: 'close', name: '친한 친구', unlock: '새 표정 · 보이스 대사', image: null, line: '친한 친구가 되면 열려요', notice: true },
  { id: 'best', name: '단짝', unlock: '단짝만 듣는 한마디', image: null, line: '…너한테는 괜찮아.' },
]

export type Episode = { id: string; title: string; condition: string; icon: 'rain' | 'paper' | 'keyring' }

// Titles come from the mate sheet's world events. Shown as examples (badge).
export const EPISODES: Episode[] = [
  { id: 'rain', title: '갑자기 비가 내린 자습 시간', condition: '친구가 되면 열려요', icon: 'rain' },
  { id: 'exam', title: '중간고사 결과 발표', condition: '친한 친구가 되면 열려요', icon: 'paper' },
  { id: 'goods', title: '필통 속 굿즈를 들킨 날', condition: '단짝이 되면 열려요', icon: 'keyring' },
]

export const CHAERIN_PROFILE = {
  name: '강채린',
  summary: '남들한텐 쌀쌀맞은데, 너한테만은 조금 따뜻한 자습 짝꿍',
  role: '방과 후 자습 짝꿍',
  situation: '모든 수업이 끝난 노을 진 교실. 담임이 짝지어 준 둘만의 자습 시간이에요.',
  firstLine: '내가 어쩌다가 너랑 단둘이 공부를 하게 됐지… 야! 책이나 봐!',
  likes: '딸기우유, 몰래 모으는 캐릭터 키링',
  dislikes: '쓴 커피, 시끄러운 곳',
  tags: ['츤데레', '갸루', '딸기우유', '노을진교실'],
  rating: '전연령',
}
