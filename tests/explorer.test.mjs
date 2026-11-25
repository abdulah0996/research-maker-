import { access } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chromium } from 'playwright'
import { startServer, testNumber } from './support.mjs'
import { services, tutoring } from '../shared/catalog.mjs'

test('desktop pinning, category controls, touch, reduced motion and editorial images', { timeout: 90000 }, async t => {
  const channel = process.env.TEST_BROWSER_CHANNEL
  if (!channel) {
    try { await access(chromium.executablePath()) } catch { return t.skip('Install Chromium or set TEST_BROWSER_CHANNEL.') }
  }
  const site = await startServer()
  const browser = await chromium.launch(channel ? { channel } : {})
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const errors = []
    desktop.on('pageerror', error => errors.push(error.message))
    await desktop.goto(site.url)
    const stage = desktop.locator('.explorer-stage')
    const selector = desktop.getByRole('combobox', { name: 'Tutoring subject', exact: true })
    await selector.waitFor()
    const sectionTop = await desktop.locator('.subject-explorer').evaluate(el => el.getBoundingClientRect().top + scrollY)
    await desktop.evaluate(y => scrollTo(0, y - 82), sectionTop)
    const indexIs = index => desktop.waitForFunction(i => document.querySelector('.explorer-controls select').value === String(i), index)
    await indexIs(0)
    await desktop.mouse.move(900, 400)
    await desktop.mouse.wheel(0, 350)
    await indexIs(2)
    assert.ok(Math.abs((await stage.boundingBox()).y - 82) < 2)
    assert.equal(await desktop.locator('.explorer-ring [aria-pressed=true]').getAttribute('aria-label'), tutoring[2].title)
    assert.notEqual(await desktop.locator('.explorer-ring').evaluate(el => getComputedStyle(el).transform), 'matrix(1, 0, 0, 1, 0, 0)')
    await desktop.mouse.wheel(0, -175)
    await indexIs(1)
    await desktop.getByRole('button', {name: 'Engineering', exact: true}).click()
    await indexIs(3)
    const active = desktop.getByRole('button', {name: 'Engineering', exact: true})
    await active.focus()
    await active.press('ArrowRight')
    await indexIs(4)
    await selector.selectOption('14')
    await indexIs(14)
    const enquiry = await desktop.locator('.explorer-content .chat').getAttribute('href')
    assert.match(new URL(enquiry).searchParams.get('text'), /Professional & Career Skills/)
    assert.equal(new URL(enquiry).pathname, '/' + testNumber)
    await desktop.mouse.move(900, 400)
    await desktop.mouse.wheel(0, 340)
    await desktop.waitForFunction(() => document.querySelector('.explorer-stage').getBoundingClientRect().top < 0)
    await desktop.mouse.wheel(0, -520)
    await indexIs(13)
    await desktop.getByRole('link', { name: 'Explore subject', exact: true }).click()
    assert.ok(desktop.url().endsWith('/tutoring/research-methods-data-analysis'))
    await desktop.getByRole('link', { name: 'Home', exact: true }).first().click()
    await desktop.locator('.subject-explorer').waitFor()
    assert.equal(await desktop.locator('.explorer-stage').count(), 1)
    for (const index of [0, 1, 2, 1, 0]) {
      await desktop.locator('.process-track article').nth(index).evaluate(item => {
        const bounds = item.getBoundingClientRect()
        scrollTo(0, scrollY + bounds.top + bounds.height / 2 - innerHeight * .44)
      })
      await desktop.waitForFunction(i => document.querySelectorAll('.process-track article')[i].dataset.active === 'true', index)
    }
    assert.ok(Math.abs((await desktop.locator('.header').boundingBox()).y) < 2)

    async function assertImages(path, locator, count) {
      await desktop.goto(site.url + path)
      const photos = desktop.locator(locator)
      assert.equal(await photos.count(), count)
      await photos.evaluateAll(images => images.forEach(image => { image.loading = 'eager' }))
      await desktop.waitForFunction(selector => [...document.querySelectorAll(selector)].every(img => img.complete && img.naturalWidth > 0), locator)
      assert.equal(new Set(await photos.evaluateAll(images => images.map(image => image.currentSrc))).size, count)
    }
    await assertImages('/services', '.service-story > img', services.length)
    await assertImages('/tutoring', '.subject-card .service-story > img', tutoring.length)
    await assertImages('/', '.explorer-photo img', tutoring.length)
    assert.deepEqual(errors, [])

    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    await phone.goto(site.url)
    const visual = phone.locator('.explorer-visual')
    await visual.scrollIntoViewIfNeeded()
    assert.equal(await phone.locator('.explorer-stage').evaluate(el => getComputedStyle(el).position), 'static')
    const box = await visual.boundingBox()
    const cdp = await phone.context().newCDPSession(phone)
    const y = Math.round(box.y + box.height / 2)
    const x = Math.round(box.x + box.width * .75)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 120, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await phone.waitForFunction(() => document.querySelector('.explorer-controls select').value === '1')
    await phone.setViewportSize({ width: 844, height: 390 })
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await desktop.goto(site.url + '/services/academic-tutoring')
    await selector.waitFor()
    const academicTop = await desktop.locator('.subject-explorer').evaluate(el => el.getBoundingClientRect().top + scrollY)
    await desktop.evaluate(y => scrollTo(0, y - 82), academicTop)
    await desktop.mouse.move(900, 400)
    await desktop.mouse.wheel(0, 350)
    await indexIs(2)
    assert.ok(Math.abs((await stage.boundingBox()).y - 82) < 2)
    await desktop.mouse.wheel(0, -175)
    await indexIs(1)
    assert.match(new URL(await desktop.locator('.explorer-content .chat').getAttribute('href')).searchParams.get('text'), /Medical & Health Sciences/)
    await desktop.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await stage.evaluate(el => getComputedStyle(el).position), 'static')
    await selector.selectOption('9')
    await indexIs(9)
  } finally {
    await browser.close()
    await site.stop()
  }
})
