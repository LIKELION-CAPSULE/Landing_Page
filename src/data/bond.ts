// S5 (relationship) and the records/rewards cards. Source: Front_Web (2026-11-28)
// - src/features/mates/affinity-stages.ts: the five stage names (hours are recommended values: left out);
// - src/features/mates/mate-worlds.ts: one world (세계관) per stage, EP.N opens at Lv.N; a world is a place that
//   changes the background, the outfit and the talk's context, the mate's character stays the same.
//   World names exist only as development samples (not in production), so none are shown here.
// - records / capsule / attendance / invite: docs/HOME_AND_RECORDS.md, docs/MY_MATES_CAPSULE_SCENE.md,
//   src/features/mobile-gate (invite reward: both get credits after the friend's first connection).
import type { PixelArtName } from '../components/pixel/pixel-art.ts'

export const AFFINITY_STAGES = [
  { stage: 1, name: '처음 만남', world: '첫 연결 후 열려요' },
  { stage: 2, name: '아는 사이', world: '2단계에서 열려요' },
  { stage: 3, name: '친구', world: '3단계에서 열려요' },
  { stage: 4, name: '친한 친구', world: '4단계에서 열려요' },
  { stage: 5, name: '단짝', world: '5단계에서 열려요' },
] as const

export const episodeLabel = (stage: number) => `EP.${String(stage).padStart(2, '0')}`

export const WORLD_POINTS = [
  { title: '배경', body: '만나는 장소가 바뀌어요' },
  { title: '옷차림', body: '장소에 맞는 옷을 입어요' },
  { title: '대화', body: '그곳의 이야기를 나눠요' },
] as const

export type RecordFeature = { icon: PixelArtName; title: string; body: string }

export const RECORD_FEATURES: readonly RecordFeature[] = [
  { icon: 'call', title: '연결 기록', body: '연결을 끊으면 함께한 시간과 나눈 대화가 연결 기록으로 남아요.' },
  { icon: 'capsule', title: '쌓이는 캡슐', body: '연결한 시간만큼 캡슐이 쌓여요. 내 메이트 화면에서 메이트 곁에 모인 캡슐을 볼 수 있어요.' },
  { icon: 'record', title: '내 기록', body: '주·월·연 단위로 함께한 시간, 만난 날, 연결 횟수를 봐요. 날짜를 누르면 그날 기록이 열려요.' },
  { icon: 'coin', title: '출석 크레딧', body: '매일 출석하면 크레딧을 받아요. 음성과 고급 대화는 크레딧 안에서 쓸 수 있어요.' },
  { icon: 'heart', title: '친구 초대', body: '초대한 친구가 가입하고 첫 연결을 마치면 둘 다 크레딧을 받아요.' },
]
