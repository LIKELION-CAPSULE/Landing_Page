// S7 copy. Source: PRD 2026-11-22 §5 (beta scope), §8 (connection rules), §9 (beta credits),
// §11.2 (AI notice, camera, age). Numbers that PRD marks as recommended are left out on purpose.

export const BETA_FACTS = [
  { label: '기간', value: '12월 1일 – 14일' },
  { label: '인원', value: '선착순 100명' },
  { label: '요금', value: '무료' },
  { label: '크레딧', value: '매일 출석 지급' },
] as const

export const START_STEPS = [
  { title: '메이트 고르기', body: '채린을 골라 세계관과 내 역할을 확인해요.' },
  { title: '연결하기', body: '영상통화처럼 연결해 말을 걸고, PIP로 작업 옆에 띄워요.' },
  { title: '연결 기록 보기', body: '연결을 끊으면 함께한 시간과 나눈 대화가 기록으로 남아요.' },
] as const

export const FAQ = [
  {
    q: '카메라를 꼭 켜야 하나요?',
    a: '아니요. 카메라 없이도 채팅과 음성으로 함께할 수 있어요. 카메라를 켜면 자리를 비웠다 돌아온 걸 채린이 알아채고, 함께한 시간이 기록돼요.',
  },
  {
    q: '카메라 영상은 어디에 저장되나요?',
    a: '저장하지 않아요. 영상은 브라우저 안에서만 판단에 쓰고, 서버에는 자리에 있는지 같은 상태만 보내요.',
  },
  {
    q: '채린은 사람인가요?',
    a: '아니요. 채린은 AI 캐릭터예요. 대화는 정해진 대본이 아니라 AI가 자유롭게 이어가요.',
  },
  {
    q: '정말 무료인가요?',
    a: '베타 동안은 결제 없이 모든 기능을 열어 둬요. 음성과 고급 대화는 매일 받는 크레딧 안에서 쓸 수 있고, 다 써도 기본 채팅과 연결은 계속돼요.',
  },
  {
    q: '휴대폰에서도 쓸 수 있나요?',
    a: '베타는 PC 웹에서 열려요. 작업 옆에 띄워 두는 PIP 기능 때문에 크롬 계열 브라우저를 권장해요.',
  },
  {
    q: '누가 가입할 수 있나요?',
    a: '만 14세 이상이면 가입할 수 있어요. 만 19세 미만은 하루 3시간까지 이용할 수 있어요.',
  },
] as const
