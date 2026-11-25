import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import mongoose from 'mongoose'
import { chromium } from 'playwright'
import { startServer, testNumber } from './support.mjs'

test('production CMS persists content, renders only published records and protects writes', {
  skip: !process.env.MONGODB_TEST_URI && 'Set MONGODB_TEST_URI to enable database integration tests.',
  timeout: 60000
}, async () => {
  const db = new URL(process.env.MONGODB_TEST_URI)
  db.pathname = '/researchmaker_test_' + Date.now()
  const email = 'owner@example.test'
  const password = 'test-only password for ResearchMaker'
  const env = { MONGODB_URI: db.href, SITE_URL: 'http://127.0.0.1', HOST: '127.0.0.1', ADMIN_EMAIL: email, ADMIN_PASSWORD: password }
  const site = await startServer(env, ['--production'])
  let session
  const request = (path, method = 'GET', data, origin = site.url) => fetch(site.url + '/api/admin' + path, {
    method, headers: { origin, ...(data && !(data instanceof FormData) ? { 'Content-Type':'application/json' } : {}), ...(session ? { cookie: session } : {}) },
    body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined
  })
  try {
    assert.equal((await request('/content')).status, 401)
    assert.equal((await request('/enquiries')).status, 401)
    const submission = { name: 'Contact fixture', email: 'learner@example.test', phone: '+44 7700 900100', service: 'academic-tutoring', subject: 'it-computer-science', message: 'Could you help me practise Python functions?', privacy: true }
    const sendEnquiry = (data, origin = site.url) => fetch(site.url + '/api/enquiries', {
      method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    })
    assert.equal((await sendEnquiry(submission, 'https://example.org')).status, 403)
    assert.equal((await sendEnquiry({ ...submission, privacy: false })).status, 422)
    assert.equal((await sendEnquiry({ ...submission, website: 'spam' })).status, 422)
    const submitted = await sendEnquiry(submission)
    assert.equal(submitted.status, 201)
    const { reference } = await submitted.json()
    assert.equal((await request('/login', 'POST', { email, password }, 'https://example.org')).status, 403)
    assert.equal((await request('/login', 'POST', { email, password: 'wrong test password' })).status, 401)
    const login = await request('/login', 'POST', {email,password})
    assert.equal(login.status, 200)
    const cookie = login.headers.get('set-cookie')
    assert.match(cookie, /HttpOnly; SameSite=Strict/i)
    session = cookie.split(';')[0]
    const enquiries = await (await request('/enquiries?status=New')).json()
    assert.equal(enquiries.items[0]._id, reference)
    assert.equal(enquiries.items[0].phone, '+447700900100')
    assert.equal((await request('/enquiries/' + reference, 'PATCH', { status: 'Contacted' })).status, 204)
    assert.equal((await (await request('/enquiries?status=Contacted')).json()).items[0]._id, reference)
    const initial = await (await request('/content')).json()
    assert.equal(initial.services.length, 13)
    assert.equal(initial.tutoring.length, 15)
    assert.equal(initial.testimonials.length, 0)

    const file = new FormData()
    file.set('image', new Blob([await readFile('public/images/code.jpg')], { type: 'image/jpeg' }), 'featured.jpg')
    const uploaded = await request('/images','POST',file)
    assert.equal(uploaded.status, 201)
    const { url } = await uploaded.json()
    assert.equal((await fetch(site.url + url)).headers.get('content-type'), 'image/webp')

    const body = '<p>Start with a clear <strong>plan</strong>.</p>'
    const draft = { title:'Planning a project', slug:'planning-a-project', summary:'Use a clear project plan.', author:'ResearchMaker', category:'Study Techniques', tags:['planning'], body, image:url, featured:true }
    const preview = await request('/preview','POST',draft)
    assert.equal(preview.status,200)
    assert.equal((await preview.json()).body, body)
    const created = await request('/posts','POST',draft)
    assert.equal(created.status, 201)
    const post = await created.json()
    assert.equal((await fetch(site.url + '/blog/' + post.slug)).status, 404)
    assert.equal((await request('/posts','POST',draft)).status, 409)
    const published = await request('/posts/' + post._id, 'PUT', { ...draft, published:true })
    assert.equal(published.status,200)
    assert.ok((await published.json()).publishedAt)
    const article = await fetch(site.url + '/blog/' + post.slug)
    const html = await article.text()
    assert.equal(article.status,200)
    assert.ok(html.includes(body))
    assert.match(html,/BlogPosting/)
    const blog = await (await fetch(site.url + '/blog')).text()
    assert.equal((blog.match(/<article class="card post-card">/g) ?? []).length, 1, 'Featured articles appear once')
    const sitemap = await (await fetch(site.url + '/sitemap.xml')).text()
    assert.ok(sitemap.includes('/blog/' + post.slug))

    const service = { ...initial.services[0], summary:'Updated tutoring summary.', image:url, alt:'Uploaded service image' }
    assert.equal((await request('/services/' + service._id,'PUT',service)).status,200)
    const subject = { ...initial.tutoring[0], image:url, alt:'Uploaded category image', topics:[...initial.tutoring[0].topics,'Computing Fundamentals'] }
    assert.equal((await request('/tutoring/' + subject._id,'PUT',subject)).status,200)
    const film = initial.topics.find(topic => topic.slug === 'film-studies')
    assert.ok(film)
    const draftTopic = { ...film, title: 'Film Sound Workshop', slug: 'film-sound-workshop', published: false }
    const topicRoute = '/tutoring/arts-media-design/film-sound-workshop'
    assert.equal((await request('/preview-topic', 'POST', draftTopic)).status, 200)
    const createdTopic = await request('/topics','POST',draftTopic)
    assert.equal(createdTopic.status, 201)
    const savedTopic = await createdTopic.json()
    assert.equal((await fetch(site.url + topicRoute)).status, 404)
    assert.equal((await request('/topics/' + savedTopic._id,'PUT',{ ...draftTopic, published: true, image: url })).status, 200)
    const topicPage = await fetch(site.url + topicRoute)
    assert.equal(topicPage.status, 200)
    assert.match(await topicPage.text(), /Enquire About Film Sound Workshop/)
    assert.match(await (await fetch(site.url + '/sitemap.xml')).text(), /film-sound-workshop/)
    assert.equal((await request('/topics/' + savedTopic._id,'PUT',{ ...draftTopic })).status, 200)
    assert.equal((await fetch(site.url + topicRoute)).status, 404)
    const testimonial = await request('/testimonials','POST',{ name:'QA fixture', review:'Test-only record.', rating:null, service:'Tutoring', approved:false, date:'2026-01-01' })
    assert.equal(testimonial.status,201)
    const review = await testimonial.json()
    let publicContent = await (await fetch(site.url + '/api/content')).json()
    assert.equal(publicContent.testimonials.length,0)
    assert.ok(publicContent.services.some(item => item.summary === service.summary))
    assert.ok(publicContent.tutoring.some(item => item.topics.includes('Computing Fundamentals')))
    const home = await (await fetch(site.url)).text()
    assert.match(home, /alt="Uploaded category image"/)
    assert.match(home, /alt="Uploaded service image"/)
    assert.equal((await request('/testimonials/' + review._id,'PUT',{...review,approved:true})).status,200)
    assert.equal((await request('/settings','PUT',{...initial.settings,whatsapp:testNumber,message:'Hello from the test.'})).status,200)
    publicContent = await (await fetch(site.url + '/api/content')).json()
    assert.equal(publicContent.testimonials[0].name,'QA fixture')
    assert.equal(publicContent.settings.message,'Hello from the test.')
    assert.equal((await request('/testimonials/' + review._id,'DELETE')).status,204)

    if (process.env.TEST_BROWSER_CHANNEL) {
      const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL })
      try {
        const page = await browser.newPage()
        await page.goto(site.url + '/contact?service=academic-tutoring#enquiry')
        const form = page.locator('#enquiry')
        await form.getByLabel('Full name').fill('Browser enquiry fixture')
        await form.getByLabel('Email address').fill(submission.email)
        await form.getByLabel('WhatsApp number').fill(submission.phone)
        assert.equal(await form.getByLabel('Service', { exact: true }).inputValue(), submission.service)
        await form.getByLabel(/Tutoring subject/).selectOption(submission.subject)
        await form.getByLabel('How can we help?').fill(submission.message)
        await form.getByRole('checkbox').check()
        await form.getByRole('button', { name: 'Submit on website' }).click()
        await form.getByRole('heading', { name: 'Enquiry received' }).waitFor()
        await page.goto(site.url + '/admin')
        await page.getByLabel('Email', { exact:true }).fill(email)
        await page.getByLabel('Password', { exact:true }).fill(password)
        await page.getByRole('button',{name:'Sign in',exact:true}).click()
        await page.getByRole('heading',{name:'Owner dashboard'}).waitFor()
        await page.getByRole('button', { name: 'Contact enquiries', exact: true }).click()
        const enquiryRow = page.locator('.admin-enquiry-row').filter({ hasText: 'Browser enquiry fixture' })
        await enquiryRow.locator('summary').click()
        await enquiryRow.getByLabel('Update enquiry status').selectOption('In Progress')
        await page.getByText(/Browser enquiry fixture.*In Progress/).waitFor()
        await page.getByRole('button',{name:'Articles',exact:true}).click()
        await page.getByRole('button',{name:draft.title,exact:true}).click()
        await page.getByRole('textbox',{name:'Article content'}).waitFor()
        await page.getByRole('button',{name:'Preview article'}).click()
        await page.getByRole('heading',{name:draft.title,exact:true}).waitFor()
        await page.getByRole('button',{name:'Tutoring topics',exact:true}).click()
        await page.getByRole('button',{name:draftTopic.title,exact:true}).click()
        await page.getByRole('button',{name:'Preview topic',exact:true}).click()
        await page.getByRole('heading',{name:draftTopic.title + ' Tutoring',exact:true}).waitFor()
        await page.getByRole('button',{name:'Sign out'}).click()
        await page.getByRole('heading',{name:'Owner sign-in'}).waitFor()
      } finally { await browser.close() }
    }

    assert.equal((await request('/posts/' + post._id, 'PUT', { ...draft, published:false })).status,200)
    assert.equal((await fetch(site.url + '/blog/' + post.slug)).status,404)
    assert.equal((await request('/posts/' + post._id, 'DELETE')).status,204)
    assert.equal((await request('/logout','POST')).status,204)
    assert.equal((await request('/session')).status,401)

    const secondLogin = await request('/login','POST',{email,password})
    session = secondLogin.headers.get('set-cookie').split(';')[0]
    const newPassword = password + ' reset'
    await promisify(execFile)(process.execPath, ['server/index.mjs','--reset-admin'], { env: { ...process.env, ...env, ADMIN_PASSWORD: newPassword } })
    assert.equal((await request('/session')).status,401)
    assert.equal((await request('/login','POST',{email,password})).status,401)
    assert.equal((await request('/login','POST',{email,password:newPassword})).status,200)
  } finally {
    await site.stop()
    const connection = await mongoose.createConnection(db.href).asPromise()
    try { await connection.dropDatabase() } finally { await connection.close() }
  }
})
