// Local browser QA. Point PLAYWRIGHT_MODULE at an installed Playwright ESM entry.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

if (!process.env.PLAYWRIGHT_MODULE) throw new Error('Set PLAYWRIGHT_MODULE to the installed Playwright index.mjs path.')
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE)
const baseURL = process.env.MACBOOK_URL || 'http://127.0.0.1:5173'
const directory = process.env.MACBOOK_QA_DIR || '/private/tmp/macbook-landing-qa'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
const report = { targetRoute: '/', desktop: [], mobile: [], errors: [], warnings: [], analyticsStubbed: true }
async function observe(page) {
  // Keep browser QA independent of telemetry availability and out of live analytics.
  await page.route(/^https:\/\/(?:[^/]+\.)?mixpanel\.com\//, route => route.fulfill({
    status: 200, contentType: 'application/json', body: '{"status":1}',
  }))
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text())
    if (message.type() === 'warning') report.warnings.push(message.text())
  })
}
async function ready(page) {
  await page.locator('.macbook-landing[data-model-status="ready"][data-intro-ready="true"][data-intro-complete="true"]').waitFor({ state: 'attached', timeout: 60000 })
  await page.waitForTimeout(1000)
}
async function sample(page, progress) {
  const end = await page.locator('.macbook-landing__story').evaluate(element => {
    const stage = document.querySelector('.macbook-landing__stage')
    const hero = document.querySelector('.macbook-landing')
    const hold = Number.parseFloat(getComputedStyle(hero).getPropertyValue('--macbook-exit-hold')) || 0
    return element.getBoundingClientRect().top + scrollY - Math.max(innerHeight, stage.getBoundingClientRect().height) - hold
  })
  await page.evaluate(y => scrollTo(0, y), Math.round(end * progress))
  await page.waitForTimeout(1000)
  return page.locator('.macbook-landing').evaluate(element => ({
    hinge: Number(element.dataset.hingeAngle), height: Number(element.dataset.height),
    rotation: Number(element.dataset.rotation), brightness: Number(element.dataset.screenBrightness),
    visible: element.dataset.modelVisible === 'true',
    frontView: element.dataset.frontView === 'true',
    landingCopy: [...element.querySelectorAll('[data-landing-item]')].map(item => {
      const style = getComputedStyle(item)
      return { name: item.dataset.landingItem, opacity: Number(style.opacity), visible: style.visibility !== 'hidden' }
    }),
    canvas: { width: element.querySelector('canvas').width, height: element.querySelector('canvas').height },
  }))
}
async function handoff(page, prefix) {
  const layout = await page.evaluate(() => {
    const hero = document.querySelector('.macbook-landing')
    const stage = hero.querySelector('.macbook-landing__stage')
    const story = document.querySelector('.macbook-landing__story')
    return {
      unit: Math.min(innerWidth, 402) / 402,
      stageHeight: stage.getBoundingClientRect().height,
      viewportHeight: innerHeight,
      hold: Number.parseFloat(getComputedStyle(hero).getPropertyValue('--macbook-exit-hold')) || 0,
      animationEnd: story.getBoundingClientRect().top + scrollY - Math.max(innerHeight, stage.getBoundingClientRect().height)
        - (Number.parseFloat(getComputedStyle(hero).getPropertyValue('--macbook-exit-hold')) || 0),
      release: hero.getBoundingClientRect().top + scrollY + hero.offsetHeight - stage.offsetHeight,
    }
  })
  assert.ok(layout.release > layout.animationEnd)
  assert.ok(layout.hold >= 200)
  assert.ok(layout.release - layout.animationEnd >= layout.hold)
  await page.evaluate(y => scrollTo(0, y), layout.animationEnd + 16)
  await page.waitForTimeout(600)
  const wheelStart = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, Math.min(100, layout.hold / 3))
  await page.waitForTimeout(500)
  const wheelHold = await page.locator('.macbook-landing__stage').evaluate(element => ({
    scroll: scrollY,
    top: element.getBoundingClientRect().top,
    hinge: Number(element.closest('.macbook-landing').dataset.hingeAngle),
    titleOpacity: Number(getComputedStyle(element.querySelector('#hero-title')).opacity),
  }))
  assert.ok(wheelHold.scroll > wheelStart)
  assert.ok(Math.abs(wheelHold.top) < 1)
  assert.equal(wheelHold.hinge, 90)
  assert.equal(wheelHold.titleOpacity, 1)
  await page.evaluate(y => scrollTo(0, y), (layout.animationEnd + layout.release) / 2)
  await page.waitForTimeout(800)
  const held = await page.locator('.macbook-landing__stage').evaluate(element => ({
    top: element.getBoundingClientRect().top,
    hinge: Number(element.closest('.macbook-landing').dataset.hingeAngle),
  }))
  assert.ok(Math.abs(held.top) < 1)
  assert.equal(held.hinge, 90)
  await page.screenshot({ path: directory + '/' + prefix + 'handoff-hold.png' })
  const titleTop = await page.locator('.problem__title').evaluate(element => element.getBoundingClientRect().top + scrollY)
  const exitPosition = layout.release + Math.max(0, layout.stageHeight - layout.viewportHeight) + 80 * layout.unit
  await page.evaluate(y => scrollTo(0, y), Math.max(exitPosition, titleTop - layout.viewportHeight * 0.75))
  await page.waitForTimeout(1000)
  const transition = await page.evaluate(() => {
    const subtitle = document.querySelector('.hero__subtitle')
    const eyebrow = document.querySelector('.problem__eyebrow')
    const title = document.querySelector('.problem__title')
    return {
      gap: eyebrow.getBoundingClientRect().top - subtitle.getBoundingClientRect().bottom,
      eyebrowOpacity: Number(getComputedStyle(eyebrow).opacity),
      titleOpacity: Number(getComputedStyle(title).opacity),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    }
  })
  assert.ok(transition.gap > 0 && transition.gap < 110 * layout.unit)
  assert.equal(transition.eyebrowOpacity, 1)
  assert.equal(transition.titleOpacity, 1)
  assert.equal(transition.horizontalOverflow, false)
  await page.screenshot({ path: directory + '/' + prefix + 'handoff.png' })
  return { hold: layout.hold, holdDistance: layout.release - layout.animationEnd, wheelHold, held, ...transition }
}
async function story(page) {
  return page.locator('.story').evaluate(element => [...element.children]
    .filter(item => item.matches('section, footer'))
    .map(item => {
      const box = item.getBoundingClientRect()
      const style = getComputedStyle(item)
      return { name: item.className, text: item.textContent, width: box.width, height: box.height,
        left: box.left, font: style.fontFamily, color: style.color, background: style.backgroundColor }
    }))
}

try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 880 } })
  await observe(page)
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await page.goto(baseURL + '/test?debug=1', { waitUntil: 'networkidle' })
  await ready(page)
  assert.equal(new URL(page.url()).pathname, '/')
  assert.equal(new URL(page.url()).search, '')
  assert.equal(await page.locator('main').getAttribute('data-macbook-page'), 'landing')
  assert.equal(await page.locator('.macbook-landing__debug').count(), 0)
  assert.equal(requests.some(url => /MacbookTestPage/.test(url)), false)
  report.retiredTestRedirect = true
  const originalStory = await story(page)
  const originalLayout = await page.locator('.hero').evaluate(element => ({
    title: element.querySelector('.hero__title').getBoundingClientRect().top,
    preview: element.querySelector('.hero__preview').getBoundingClientRect().top,
  }))
  const originalBranding = await page.locator('.hero').evaluate(element => {
    const logo = element.querySelector('.logo')
    const title = element.querySelector('.hero__title')
    const image = logo.matches('img') ? logo : logo.querySelector('img')
    return { logo: image?.getAttribute('src'), logoWidth: logo.getBoundingClientRect().width,
      fontSize: getComputedStyle(title).fontSize, font: getComputedStyle(title).fontFamily,
      subtitle: element.querySelector('.hero__subtitle').textContent.replace(/\s+/g, ' ').trim() }
  })
  requests.length = 0

  await page.addInitScript(() => {
    window.__macbookDrawCalls = 0
    for (const constructor of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!constructor) continue
      for (const method of ['drawElements', 'drawArrays']) {
        const original = constructor.prototype[method]
        constructor.prototype[method] = function (...args) {
          window.__macbookDrawCalls += 1
          return Reflect.apply(original, this, args)
        }
      }
    }
  })
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.locator('#hero-title[data-typing="true"]').waitFor()
  await page.evaluate(() => {
    window.__macbookIntroEvents = []
    const checks = [
      ['logo', '.logo'], ['title', '#hero-title .macbook-landing__type-text'],
      ['model', '.macbook-landing'], ['hint', '[data-intro-item="hint"]'],
    ]
    const seen = new Set()
    const observeIntro = () => {
      for (const [name, selector] of checks) {
        if (seen.has(name)) continue
        const element = document.querySelector(selector)
        if (!element) continue
        const style = getComputedStyle(element)
        const visible = name === 'model' ? element.dataset.modelVisible === 'true'
          : style.visibility !== 'hidden' && Number(style.opacity) >= 0.6 &&
            (name !== 'title' || element.textContent.trim().length > 0)
        if (visible) { seen.add(name); window.__macbookIntroEvents.push({ name, time: performance.now() }) }
      }
      if (seen.size < checks.length) requestAnimationFrame(observeIntro)
    }
    requestAnimationFrame(observeIntro)
  })
  assert.equal(await page.locator('.macbook-landing__debug').count(), 0)
  assert.notEqual(await page.locator('.macbook-landing').getAttribute('data-model-visible'), 'true')
  await page.screenshot({ path: directory + '/typing.png' })
  await ready(page)
  assert.equal(await page.locator('main').getAttribute('data-macbook-page'), 'landing')
  assert.equal(await page.title(), '캡슐 CAPSULE · 같이 공부하고 싶은 AI 공부 메이트')
  report.mainTitlePreserved = true
  report.introOrder = await page.evaluate(() => window.__macbookIntroEvents)
  assert.deepEqual(report.introOrder.map(event => event.name), ['logo', 'title', 'model', 'hint'])
  assert.equal(await page.locator('#hero-title').getAttribute('aria-label'), '오늘도 혼자 공부해? 나랑 같이 하자.')
  const branding = await page.locator('.macbook-landing').evaluate(element => {
    const logo = element.querySelector('.logo')
    const title = element.querySelector('.hero__title')
    const image = logo.matches('img') ? logo : logo.querySelector('img')
    return { logo: image?.getAttribute('src'), logoWidth: logo.getBoundingClientRect().width,
      fontSize: getComputedStyle(title).fontSize, font: getComputedStyle(title).fontFamily,
      subtitle: element.querySelector('.hero__subtitle').textContent.replace(/\s+/g, ' ').trim() }
  })
  assert.deepEqual(branding, originalBranding)
  report.logo = branding.logo
  const currentLayout = await page.locator('.macbook-landing').evaluate(element => ({
    title: element.querySelector('.hero__title').getBoundingClientRect().top,
    preview: element.querySelector('.hero__preview').getBoundingClientRect().top,
  }))
  report.initialLayoutOffset = { title: currentLayout.title - originalLayout.title, model: currentLayout.preview - originalLayout.preview }
  assert.equal(report.initialLayoutOffset.title, 0)
  assert.equal(report.initialLayoutOffset.model, 0)
  assert.deepEqual(await story(page), originalStory)
  report.retiredURLMatchesLanding = true

  await page.waitForTimeout(500)
  const idleBefore = await page.evaluate(() => window.__macbookDrawCalls)
  await page.waitForTimeout(900)
  const idleAfter = await page.evaluate(() => window.__macbookDrawCalls)
  assert.ok(idleBefore > 0)
  assert.equal(idleAfter, idleBefore)
  report.idleRendering = { before: idleBefore, after: idleAfter }

  for (const [progress, name] of [[0, 'closed'], [0.06, 'open-start'], [0.3, 'early-opening'], [0.5, 'half-open'], [0.7, 'screen-on'], [0.85, 'fully-open'], [1, 'complete']]) {
    const value = await sample(page, progress)
    report.desktop.push({ name, ...value })
    assert.equal(value.rotation, 0)
    assert.equal(value.height, 0)
    assert.equal(value.frontView, true)
    if (name === 'closed') assert.equal(value.hinge, 0)
    if (name === 'early-opening') {
      assert.ok(value.hinge > 0 && value.hinge < 90)
    }
    if (name === 'half-open') {
      assert.ok(value.hinge > report.desktop.find(item => item.name === 'early-opening').hinge && value.hinge < 90)
    }
    if (name === 'screen-on') {
      assert.ok(value.hinge > report.desktop.find(item => item.name === 'half-open').hinge && value.hinge < 90)
      assert.ok(value.brightness > 0 && value.brightness < 1)
    }
    if (name === 'complete') {
      assert.equal(value.hinge, 90); assert.equal(value.height, 0); assert.equal(value.brightness, 1)
      assert.equal(value.rotation, 0)
      assert.equal(value.landingCopy.length, 2)
      assert.ok(value.landingCopy.every(item => item.visible && item.opacity === 1))
    } else assert.ok(value.landingCopy.every(item => !item.visible && item.opacity === 0))
    if (name === 'fully-open') assert.equal(value.hinge, 90)
    await page.screenshot({ path: directory + '/' + name + '.png' })
  }
  assert.equal(requests.filter(url => url.includes('macbook_web_ready.glb')).length, 1)
  report.desktopHandoff = await handoff(page, '')
  const reverseOpening = await sample(page, 0.5)
  assert.ok(Math.abs(reverseOpening.hinge - report.desktop.find(item => item.name === 'half-open').hinge) < 1)
  const beforePointer = await page.locator('canvas').screenshot()
  await page.mouse.move(1050, 250)
  await page.waitForTimeout(700)
  assert.deepEqual(await page.locator('canvas').screenshot(), beforePointer)
  report.noPointerMotion = true
  const reversed = await sample(page, 0)
  assert.ok(reversed.landingCopy.every(item => !item.visible && item.opacity === 0))
  assert.equal(Number(await page.locator('.macbook-landing').getAttribute('data-hinge-angle')), 0)
  report.reverse = true

  await page.locator('.story .steps__title').scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  assert.equal(await page.locator('.story .steps__title').getAttribute('data-visible'), '')
  await page.screenshot({ path: directory + '/original-story.png' })
  await page.locator('.story .rooms .cta').click()
  await page.waitForURL(baseURL + '/rooms')
  await page.locator('.macbook-landing').waitFor({ state: 'detached' })
  assert.equal(await page.locator('canvas').count(), 0)
  assert.equal(await page.locator('.macbook-landing').count(), 0)
  report.roomCta = true
  report.unmount = true
  await page.goBack()
  await ready(page)
  assert.equal(new URL(page.url()).pathname, '/')
  assert.equal(await page.locator('canvas').count(), 1)
  assert.equal(Number(await page.locator('.macbook-landing').getAttribute('data-hinge-angle')), 90)
  report.roomBackToLanding = true

  await page.close()

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  await observe(mobile)
  await mobile.goto(baseURL, { waitUntil: 'networkidle' })
  await ready(mobile)
  for (const [progress, name] of [[0, 'closed'], [0.5, 'opening'], [1, 'complete']]) {
    const value = await sample(mobile, progress)
    assert.equal(value.rotation, 0)
    assert.equal(value.height, 0)
    assert.equal(value.frontView, true)
    if (name === 'opening') assert.ok(value.hinge > 0 && value.hinge < 90)
    assert.ok(value.canvas.width <= 390 * 2 + 2)
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    report.mobile.push({ name, ...value })
    await mobile.screenshot({ path: directory + '/mobile-' + name + '.png' })
  }
  report.mobileHandoff = await handoff(mobile, 'mobile-')
  await mobile.close()

  const shortMobile = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true })
  await observe(shortMobile)
  await shortMobile.goto(baseURL, { waitUntil: 'networkidle' })
  await ready(shortMobile)
  assert.equal((await sample(shortMobile, 1)).hinge, 90)
  report.shortMobileHandoff = await handoff(shortMobile, 'short-mobile-')
  await shortMobile.close()

  const reduced = await browser.newPage({ viewport: { width: 1360, height: 880 }, reducedMotion: 'reduce' })
  await observe(reduced)
  await reduced.goto(baseURL + '/?debug=1', { waitUntil: 'networkidle' })
  await ready(reduced)
  assert.equal(await reduced.locator('#hero-title').getAttribute('data-typing'), 'false')
  assert.equal(Number(await reduced.locator('.macbook-landing').getAttribute('data-hinge-angle')), 90)
  assert.equal(Number(await reduced.locator('.macbook-landing').getAttribute('data-height')), 0)
  assert.equal(await reduced.locator('.macbook-landing').getAttribute('data-model-visible'), 'true')
  assert.equal(await reduced.locator('[data-landing-item]').evaluateAll(items => items.every(item => getComputedStyle(item).visibility === 'visible' && getComputedStyle(item).opacity === '1')), true)
  assert.equal(await reduced.locator('.macbook-landing__debug').count(), 0)
  assert.equal(await reduced.locator('.macbook-landing__home-link').count(), 0)
  report.mainDebugDisabled = true
  report.reducedMotion = true
  await reduced.close()
  await writeFile(directory + '/report.json', JSON.stringify(report, null, 2))
  assert.deepEqual(report.errors, [])
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
