import poster1 from '../assets/optimized/hero/poster-1.webp'
import poster2 from '../assets/optimized/hero/poster-2.webp'
import poster3 from '../assets/optimized/hero/poster-3.webp'
import poster4 from '../assets/optimized/hero/poster-4.webp'
import poster5 from '../assets/optimized/hero/poster-5.webp'
import poster6 from '../assets/optimized/hero/poster-6.webp'
import poster7 from '../assets/optimized/hero/poster-7.webp'
import poster8 from '../assets/optimized/rooms/poster-8.webp'
import poster9 from '../assets/optimized/rooms/poster-9.webp'

export type Room = {
  id: string
  name: string
  // An empty synopsis stays hidden until the copy is ready.
  description: string
  image: string
  // Matches the hero poster classes: corner radius and image crop differ per art.
  variant: string
}

const DESCRIPTION_PLACEHOLDER = ''

export const ROOMS: Room[] = [
  { id: 'smile', name: '쌀쌀맞은 가루짝꿍이 나에게만 친절하다!', description: DESCRIPTION_PLACEHOLDER, image: poster1, variant: 'poster--r5 poster--fill' },
  { id: 'lantern', name: '김상병의 두근두근 비밀연등', description: DESCRIPTION_PLACEHOLDER, image: poster2, variant: 'poster--r9' },
  { id: 'top', name: '전교 1등을 이겨라', description: DESCRIPTION_PLACEHOLDER, image: poster3, variant: 'poster--r9' },
  { id: 'fenesis', name: '페네시스 마법학교', description: DESCRIPTION_PLACEHOLDER, image: poster4, variant: 'poster--r5 poster--fill poster--crop' },
  { id: 'cat', name: '냥냥이가 날 그렇게 쳐다보면 집중할 수가 없잖아!!', description: DESCRIPTION_PLACEHOLDER, image: poster5, variant: '' },
  { id: 'baekdojun', name: '백도준', description: DESCRIPTION_PLACEHOLDER, image: poster6, variant: 'poster--r5 poster--fill' },
  { id: 'jurassic', name: '쥬라기 독서실', description: DESCRIPTION_PLACEHOLDER, image: poster7, variant: '' },
  { id: 'iljin', name: '모르는 일진이 나한테 말을 건다', description: DESCRIPTION_PLACEHOLDER, image: poster8, variant: 'poster--r9' },
  { id: 'lab', name: '뚝딱뚝딱 실험실', description: DESCRIPTION_PLACEHOLDER, image: poster9, variant: 'poster--r9' },
]
