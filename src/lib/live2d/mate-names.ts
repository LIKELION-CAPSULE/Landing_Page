// Server mate name → landing mate (Front_Web src/features/mates/catalog.ts `sourceNames` / `launchMateId`,
// 2026-11-28). 서진 is the server name of the boy mate whose persona is 서도현. Anything else (e.g. the legacy test
// mate 「말포이」) maps to none. No imports: tests/live2d.test.ts reads it directly.
export type MateId = 'chaerin' | 'dohyun'

export const SERVER_NAMES: Readonly<Record<MateId, readonly string[]>> = {
  chaerin: ['채린'],
  dohyun: ['서도현', '도현', '서진'],
}
/** The display name an entry should carry to win over another name mapped to the same mate. */
export const OWN_NAMES: Readonly<Record<MateId, string>> = { chaerin: '채린', dohyun: '서도현' }

const normalized = (name: string) => name.replace(/\s+/g, '').toLocaleLowerCase('ko-KR')

export function mateIdForServerName(name: unknown): MateId | undefined {
  if (typeof name !== 'string' || !name.trim()) return undefined
  const value = normalized(name)
  return (Object.keys(SERVER_NAMES) as MateId[]).find(id => SERVER_NAMES[id].some(candidate => normalized(candidate) === value))
}
