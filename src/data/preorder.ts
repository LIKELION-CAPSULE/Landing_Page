export type Terms = {
  title: string
  rows: { label: string; value: string }[]
  note: string
}

export type Consent = {
  id: 'privacy' | 'marketing'
  label: string
  required: boolean
  // Plain-language summary shown from "보기". Draft copy: have it reviewed
  // before launch.
  terms: Terms
}

export type PreorderDraft = {
  email: string
  consents: Record<Consent['id'], boolean>
}

// A local review is intentionally separate from a server-confirmed reservation.
export type PreorderReview = { email: string; roomId: string }

export function createPreorderDraft(): PreorderDraft {
  return { email: '', consents: { privacy: false, marketing: false } }
}

export const CONSENTS: Consent[] = [
  {
    id: 'privacy',
    label: '[필수] 개인정보 수집·이용 동의',
    required: true,
    terms: {
      title: '개인정보 수집·이용 동의',
      rows: [
        { label: '수집 항목', value: '이메일 주소(필수), 설문조사 응답(선택)' },
        { label: '이용 목적', value: '출시 알림 발송, 사전예약 혜택(투표한 룸 무료 해금) 지급, 스터디룸 기획을 위한 통계' },
        { label: '보유 기간', value: '서비스 출시 후 6개월이 지나면 바로 파기해요.' },
      ],
      note: '동의하지 않을 수 있어요. 다만 동의하지 않으면 사전예약에 참여할 수 없어요.',
    },
  },
  {
    id: 'marketing',
    label: '[선택] 이벤트·혜택 정보 수신 동의',
    required: false,
    terms: {
      title: '이벤트·혜택 정보 수신 동의',
      rows: [
        { label: '수집 항목', value: '이메일 주소' },
        { label: '이용 목적', value: '이벤트, 할인·프로모션, 새 스터디룸 소식 안내' },
        { label: '보유 기간', value: '동의를 철회하거나, 서비스 출시 후 6개월이 지날 때까지' },
      ],
      note: '동의하지 않아도 사전예약과 출시 알림은 그대로 받을 수 있어요. 수신 동의는 capsulestudywithme@gmail.com으로 언제든 철회할 수 있어요.',
    },
  },
]
