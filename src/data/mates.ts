// Launch mates shown on the landing. Source of truth: Front_Web src/features/mates/catalog.ts
// (launchMates, 2026-11-28). Name, one-line introduction, role, starting situation, first line,
// relation tags and age rating are copied from there. 채린's likes/dislikes come from the PM mate
// sheet (2026-11-24); the app has no such field for 서도현, so none is shown for him.
import chaerinHero from '../assets/mates/chaerin/chaerin-v2-hero.webp'
import dohyunHero from '../assets/mates/dohyun/dohyun-hero.webp'
import chaerinAvatar from '../assets/mates/chaerin/avatar-96.webp'
import dohyunAvatar from '../assets/mates/dohyun/avatar-96.webp'
import type { MateId } from '../lib/live2d/mate-names.ts'

export type { MateId }

export type LandingMate = {
  id: MateId
  /** Display name (app catalogue). */
  name: string
  /** Full name, where the mate has one on its name tag. */
  fullName: string
  introduction: string
  role: string
  situation: string
  firstLine: string
  likes?: string
  dislikes?: string
  /** relationTag · callTag in the app catalogue. */
  tags: readonly string[]
  rating: string
  /** Hero still: head → waist, the same engine view as the live model (760×900 @2x). */
  hero: string
  /** 96×96 (48 CSS px @2x). */
  avatar: string
  heroAlt: string
}

export const MATES: readonly LandingMate[] = [
  {
    id: 'chaerin',
    name: '채린',
    fullName: '강채린',
    introduction: '남들한텐 차갑지만 너한테만 따뜻한 갸루 짝꿍',
    role: '함께 공부하는 학생',
    situation: '모든 수업이 끝나고 교실에 남아서 자습을 하는 상황',
    firstLine: '내가 어쩌다가 너랑 단둘이 공부를 하게 됐지… 야! 책이나 봐!',
    likes: '딸기우유, 몰래 모으는 캐릭터 키링',
    dislikes: '쓴 커피, 시끄러운 곳',
    tags: ['짝꿍형', '같은 반 짝꿍'],
    rating: '전연령',
    hero: chaerinHero,
    avatar: chaerinAvatar,
    heroAlt: '채린. 허리까지 오는 금발에 흰 셔츠와 느슨한 검은 넥타이 차림의 AI 캐릭터',
  },
  {
    id: 'dohyun',
    name: '서도현',
    fullName: '서도현',
    introduction: '말은 퉁명스러워도 늘 곁에 있는 무뚝뚝한 소꿉친구',
    role: '어릴 때부터 함께 자란 소꿉친구이자 공부 메이트',
    situation: '시험을 앞둔 주말 오후, 늘 함께 공부하던 동네 독서실에서 마주 앉은 상황',
    firstLine: '왔냐. 네 자리 맡아놨으니까 앉아. …뭐 해, 공부 안 하고.',
    tags: ['소꿉친구형', '오랜 소꿉친구'],
    rating: '전연령',
    hero: dohyunHero,
    avatar: dohyunAvatar,
    heroAlt: '서도현. 흐트러진 짙은 갈색 머리에 검은 교복 재킷과 줄무늬 넥타이 차림의 AI 캐릭터',
  },
]

export const mateById = (id: MateId) => MATES.find(mate => mate.id === id)!
