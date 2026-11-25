import { access } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { chromium } from 'playwright'
import { services, tutoring } from '../shared/catalog.mjs'
import { formatWhatsAppNumber, whatsappLink } from '../shared/whatsapp.mjs'
import { validators } from '../server/validation.mjs'

import { startServer, testNumber } from './support.mjs'

let site
before(async () => { site = await startServer() })
after(async () => { if (site) await site.stop() })

test('public routes, all service and subject details, canonical and sitemap', async () => {
  assert.equal(services.length, 13)
  assert.equal(tutoring.length, 15)
  const routes = ['/','/about','/services','/tutoring','/blog','/testimonials','/contact','/faq','/privacy','/terms','/cookies','/academic-integrity']
  const details = [...services.map(item => ['/services/' + item.slug, item]), ...tutoring.map(item => ['/tutoring/' + item.slug, item])]
  for (const [path, item] of [...routes.map(path => [path]), ...details]) {
    const response = await fetch(site.url + path)
    const html = await response.text()
    assert.equal(response.status, 200, path)
    assert.match(html, /<h1>/)
    assert.ok(html.includes('https://researchmaker.co.uk' + path))
    assert.match(html, /application\/ld\+json/)
    if (item) assert.ok(html.includes(item.title.replaceAll('&', '&amp;')))
    if (path.startsWith('/services/')) {
      assert.match(html, /id="service-details"/)
      assert.equal(html.match(/class="service-examples"><h3>Examples of how we can help<\/h3><dl[^>]*><div><dt>.+?<\/dt><dd>.+?<\/dd><\/div><div><dt>.+?<\/dt><dd>.+?<\/dd><\/div><\/dl>/)?.length, 1, path)
    }
  }
  const sitemap = await (await fetch(site.url + '/sitemap.xml')).text()
  for (const path of [...routes, ...details.map(([path]) => path)]) assert.ok(sitemap.includes('https://researchmaker.co.uk' + path + '</loc>'))
  const missing = await fetch(site.url + '/missing')
  assert.equal(missing.status, 404)
  assert.match(await missing.text(), /name="robots" content="noindex"/)
  assert.equal((await fetch(site.url + '/api/admin/session')).status, 503)
})

test('service and subject WhatsApp messages are encoded correctly', () => {
  assert.equal(formatWhatsAppNumber(testNumber), '+44 7700 900123')
  assert.equal(whatsappLink('', 'Hello'), null)
  assert.equal(whatsappLink('invalid', 'Hello'), null)
  const url = new URL(whatsappLink('+' + testNumber, 'Default', 'IT tutoring for C and C++'))
  assert.equal(url.origin, 'https://wa.me')
  assert.equal(url.pathname, '/' + testNumber)
  assert.equal(url.searchParams.get('text'), 'Hello ResearchMaker, I am interested in IT tutoring for C and C++. Could you please share more information?')
  assert.equal(new URL(whatsappLink(testNumber, 'Default')).searchParams.get('text'), 'Default')
})

test('article validation preserves supported formatting and sanitises HTML', () => {
  const data = validators.posts.parse({ title:'Article',slug:'article',summary:'Summary',author:'Editor',category:'Study Techniques',tags:[],body:'<p><strong>Text</strong><a href="https://example.org/">Link</a></p>' })
  assert.equal(data.body, '<p><strong>Text</strong><a href="https://example.org/">Link</a></p>')
  assert.equal(validators.posts.safeParse({ ...data, body:'<p></p>' }).success, false)
})

test('hydration, mobile navigation, subject search and viewport widths', async t => {
  const channel = process.env.TEST_BROWSER_CHANNEL
  if (!channel) {
    try { await access(chromium.executablePath()) } catch { return t.skip('Install Chromium or set TEST_BROWSER_CHANNEL.') }
  }
  const browser = await chromium.launch(channel ? { channel } : {})
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const width of [1440,1280,1024,768,430,390,320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const path of ['/','/services','/tutoring','/tutoring/it-computer-science','/blog','/contact','/admin']) {
        await page.goto(site.url + path)
        await page.evaluate(() => document.fonts.ready)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Overflow at ' + width + ' on ' + path)
      }
    }
    await page.goto(site.url + '/services/academic-tutoring')
    await page.getByRole('heading', { name: 'Explore Learning Without Limits.' }).waitFor()
    assert.equal(await page.locator('#tutoring-subjects .subject-card').count(), tutoring.length)
    assert.equal(await page.locator('.explorer-ring button').count(), tutoring.length)
    await page.getByRole('searchbox').fill('Python Programming')
    assert.equal(await page.locator('#tutoring-subjects .subject-card').count(), 1)
    await page.getByRole('link', { name: 'Python Programming', exact: true }).click()
    await page.getByRole('heading', { name: 'Python Programming Tutoring', exact: true }).waitFor()
    assert.ok(await page.locator('.photo-hero-image img').evaluate(img => img.complete && img.naturalWidth > 0))
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(site.url)
    const desktopLink = await page.getByRole('navigation', {name:'Main navigation'}).getByRole('link',{name:'Services'}).getAttribute('href')
    assert.equal(desktopLink, '/services')
    const hero = page.locator('.immersive-hero')
    const heroChat = hero.getByRole('link', { name: 'Enquire on WhatsApp' })
    for (const [title, path, enquiry] of [
      ['IT & Computer Science', '/tutoring/it-computer-science', /IT & Computer Science/],
      ['Medical & Health Sciences', '/tutoring/medical-health-sciences', /Medical & Health Sciences/],
      ['Law & Legal Studies', '/tutoring/law-llb', /Law/],
      ['Research & Academic Support', '/services/academic-research-support', /Academic Research Support/]
    ]) {
      const option = hero.getByRole('button', { name: title, exact: true })
      await option.click()
      assert.equal(await option.getAttribute('aria-pressed'), 'true')
      assert.equal(await hero.getByRole('link', { name: /Explore/ }).getAttribute('href'), path)
      const chat = new URL(await heroChat.getAttribute('href'))
      assert.equal(chat.pathname, '/' + testNumber)
      assert.match(chat.searchParams.get('text'), enquiry)
      assert.ok(await hero.locator('img[data-active="true"]').evaluate(async img => { await img.decode(); return img.naturalWidth > 0 }))
    }
    assert.equal(await page.locator('.desktop-chat .chat-number').innerText(), '+44 7700 900123')
    assert.equal(await page.locator('footer .chat-number').innerText(), '+44 7700 900123')
    await page.setViewportSize({ width: 320, height: 900 })
    await page.waitForFunction(() => document.documentElement.scrollWidth === 320)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320)
    assert.ok(await page.getByRole('link', { name: 'WhatsApp +44 7700 900123', exact: true }).isVisible())
    await page.getByRole('button', {name:'Open menu'}).click()
    await page.getByRole('navigation', {name:'Mobile navigation'}).getByRole('link', {name:'Tutoring'}).click()
    await page.getByRole('searchbox').fill('Python Programming')
    assert.equal(await page.locator('.card').count(), 1)
    await page.getByRole('link', {name:'Python Programming', exact:true}).click()
    await page.getByRole('heading', { name: 'Python Programming Tutoring', exact: true }).waitFor()
    const link = await page.locator('main').getByRole('link', { name: 'Enquire About Python Programming', exact: true }).first().getAttribute('href')
    assert.match(new URL(link).searchParams.get('text'), /Python Programming tutoring/)
    await page.goto(site.url + '/contact')
    assert.equal(await page.locator('.page-intro .chat-number').innerText(), '+44 7700 900123')
    await page.goto(site.url)
    const finder = page.locator('#support-finder')
    await finder.getByRole('button', { name: 'Plan research' }).click()
    await finder.getByRole('link', { name: /Research Proposal Guidance/ }).click()
    await page.getByRole('heading', { name: 'From your question to a next step' }).waitFor()
    await page.getByRole('link', { name: 'Ask about this service' }).click()
    const enquiry = page.locator('#enquiry')
    assert.equal(await enquiry.getByLabel('Service', { exact: true }).inputValue(), 'research-proposal-guidance')
    await enquiry.getByLabel('Full name').fill('Test Learner')
    await enquiry.getByLabel('Email address').fill('learner@example.test')
    await enquiry.getByLabel('WhatsApp number').fill('+44 7700 900100')
    await enquiry.getByLabel('How can we help?').fill('I need help narrowing my research question.')
    await enquiry.getByRole('checkbox').check()
    await page.evaluate(() => { window.open = url => { document.body.dataset.openedDraft = url } })
    await enquiry.getByRole('button', { name: 'Continue to WhatsApp' }).click()
    const draft = new URL(await enquiry.getByRole('link', { name: 'Open WhatsApp again' }).getAttribute('href'))
    assert.equal(draft.href, await page.locator('body').getAttribute('data-opened-draft'))
    assert.equal(draft.pathname, '/' + testNumber)
    assert.match(draft.searchParams.get('text'), /Name: Test Learner\nEmail: learner@example.test\nWhatsApp: \+44 7700 900100\nService: Research Proposal Guidance\n\nMessage:\nI need help narrowing my research question\./)
    assert.match(new URL(await enquiry.getByRole('link', { name: 'Enquire on WhatsApp' }).getAttribute('href')).searchParams.get('text'), /Research Proposal Guidance/)
    await page.goto(site.url + '/tutoring')
    await page.getByRole('button', { name: 'University', exact: true }).click()
    await page.getByRole('heading', { name: 'Connect theory with your module and independent work.' }).waitFor()
    assert.deepEqual(errors, [])
  } finally { await browser.close() }
})
