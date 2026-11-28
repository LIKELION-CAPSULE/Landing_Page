import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OPEN_AT, parseAppUrl, phaseAt, stateAt } from '../src/lib/open-date.ts'

const kst = (iso: string) => Date.parse(`${iso}+09:00`)

test('opening moment is 2026-12-01 00:00 KST', () => {
  assert.equal(OPEN_AT, Date.parse('2026-11-30T15:00:00Z'))
})

test('before 12/1 KST: locked 「12월 1일 오픈」 whatever the app address', () => {
  for (const now of [kst('2026-11-28T12:00:00'), kst('2026-11-30T23:59:59.999')]) {
    assert.equal(phaseAt(now), 'before')
    assert.equal(stateAt(now, true), 'before_open')
    assert.equal(stateAt(now, false), 'before_open')
  }
})

test('from 12/1 00:00 KST: link with a valid app address, otherwise 「오픈 준비 중」', () => {
  for (const now of [OPEN_AT, kst('2026-12-01T00:00:01'), kst('2026-12-14T18:00:00')]) {
    assert.equal(phaseAt(now), 'after')
    assert.equal(stateAt(now, true), 'open')
    assert.equal(stateAt(now, false), 'preparing')
  }
})

test('a browser in another time zone flips at the same instant', () => {
  // 2026-11-30 07:00 in Los Angeles (UTC−8) is 12/1 00:00 KST.
  assert.equal(phaseAt(Date.parse('2026-11-30T07:00:00-08:00')), 'after')
  assert.equal(phaseAt(Date.parse('2026-11-30T06:59:59-08:00')), 'before')
})

test('VITE_APP_URL: absolute http(s) only; a bare origin goes to /login', () => {
  assert.equal(parseAppUrl('https://capsule.ai.kr'), 'https://capsule.ai.kr/login')
  assert.equal(parseAppUrl('https://capsule.ai.kr/'), 'https://capsule.ai.kr/login')
  assert.equal(parseAppUrl(' https://capsule.ai.kr/login '), 'https://capsule.ai.kr/login')
  assert.equal(parseAppUrl('https://capsule-front-web.vercel.app/login?x=1'), 'https://capsule-front-web.vercel.app/login?x=1')
  for (const bad of [undefined, '', '   ', 'capsule.ai.kr', '/login', 'javascript:alert(1)', 'ftp://capsule.ai.kr']) {
    assert.equal(parseAppUrl(bad), null, String(bad))
  }
})
