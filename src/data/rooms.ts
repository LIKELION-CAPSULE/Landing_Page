import poster1 from '../assets/hero/poster-1.png'
import poster2 from '../assets/hero/poster-2.png'
import poster3 from '../assets/hero/poster-3.png'
import poster4 from '../assets/hero/poster-4.png'
import poster5 from '../assets/hero/poster-5.png'
import poster6 from '../assets/hero/poster-6.png'
import poster7 from '../assets/hero/poster-7.png'

export type Room = {
  id: string
  name: string
  // Synopsis is still being written; every room shows a placeholder for now.
  description: string
  image: string
  // Matches the hero poster classes: corner radius and image crop differ per art.
  variant: string
  tags?: string
}

const DESCRIPTION_PLACEHOLDER = '설명'

export const ROOMS: Room[] = [
  { id: 'smile', name: '쌀쌀맞은 가루짝꿍이 나에게만 친절하다!', description: DESCRIPTION_PLACEHOLDER, image: poster1, variant: 'poster--r5 poster--fill', tags: '#청춘 #연애' },
  { id: 'lantern', name: '김상병의 두근두근 비밀연등', description: DESCRIPTION_PLACEHOLDER, image: poster2, variant: 'poster--r9' },
  { id: 'top', name: '전교 1등을 이겨라', description: DESCRIPTION_PLACEHOLDER, image: poster3, variant: 'poster--r9' },
  { id: 'fenesis', name: '페네시스 마법학교', description: DESCRIPTION_PLACEHOLDER, image: poster4, variant: 'poster--r5 poster--fill poster--crop' },
  { id: 'cat', name: '냥냥이가 날 그렇게 쳐다보면 집중할 수가 없잖아!!', description: DESCRIPTION_PLACEHOLDER, image: poster5, variant: '' },
  { id: 'baekdojun', name: '백도준', description: DESCRIPTION_PLACEHOLDER, image: poster6, variant: 'poster--r5 poster--fill' },
  { id: 'jurassic', name: '쥬라기 독서실', description: DESCRIPTION_PLACEHOLDER, image: poster7, variant: '', tags: '#청춘 #연애' },
]
