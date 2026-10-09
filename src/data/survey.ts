export type SurveyOption = {
  label: string
  // Long labels drop to 16px so a row still fits the 320px column.
  compact?: boolean
}

export type SurveyGroup = {
  id: string
  title: string
  // Rows are fixed as designed rather than left to wrap.
  rows: SurveyOption[][]
}

export const SURVEY_GROUPS: SurveyGroup[] = [
  {
    id: 'relation',
    title: '관계',
    rows: [
      [{ label: '선배' }, { label: '동기' }, { label: '후배' }, { label: '연인' }],
      [{ label: '라이벌' }, { label: '상사·교수' }, { label: '소꿉친구' }],
    ],
  },
  {
    id: 'personality',
    title: '성격',
    rows: [
      [{ label: '다정함' }, { label: '엄격함' }, { label: '츤데레' }],
      [{ label: '장난꾸러기' }, { label: '차분함' }, { label: '도도함' }],
    ],
  },
  {
    id: 'world',
    title: '세계관',
    rows: [
      [{ label: '학교·캠퍼스', compact: true }, { label: '사극' }, { label: '판타지·로판', compact: true }],
      [{ label: '아이돌' }, { label: '군대' }, { label: '오피스' }, { label: 'SF' }],
    ],
  },
]

export type SurveyAnswers = {
  // Picked labels per group id.
  picks: Record<string, ReadonlySet<string>>
  wish: string
}

export const EMPTY_SURVEY: SurveyAnswers = { picks: {}, wish: '' }
