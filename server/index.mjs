import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'
import mongoose from 'mongoose'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import sharp from 'sharp'
import { models, Image, Settings, Admin } from './models.mjs'
import { connected, readContent, readSettings, seedCatalogue, seedTopics } from './content.mjs'
import { login, logout, requireAdmin, setAdmin } from './auth.mjs'
import { validators } from './validation.mjs'
import { adminEnquiries, publicEnquiries } from './enquiries.mjs'
import { categoryKey, topicPath } from '../shared/topic-routes.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production'
const siteUrl = new URL(process.env.SITE_URL ?? 'https://researchmaker.co.uk')
const base = siteUrl.origin
const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(siteUrl.hostname)
if (production && siteUrl.protocol !== 'https:' && !loopback) throw new Error('An HTTPS SITE_URL is required in production.')
const port = Number(process.env.PORT ?? 5173)
if (production && !process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in production.')
if (process.env.WHATSAPP_NUMBER && !/^\+?[1-9]\d{7,14}$/.test(process.env.WHATSAPP_NUMBER)) throw new Error('Invalid WHATSAPP_NUMBER.')
if (process.env.MONGODB_URI) {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  await Promise.all([...Object.values(models), Admin].map(model => model.init()))
  if (process.argv.includes('--reset-admin')) {
    await setAdmin(process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? '', process.env.ADMIN_PASSWORD ?? '', true)
    await mongoose.disconnect()
    console.log('Admin password reset and sessions revoked.')
    process.exit(0)
  }
  await seedCatalogue()
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) await setAdmin(process.env.ADMIN_EMAIL.trim().toLowerCase(), process.env.ADMIN_PASSWORD)
} else if (process.argv.includes('--reset-admin')) {
  throw new Error('MONGODB_URI is required to reset an admin password.')
}

const app = express()
const server = createServer(app)
if (process.env.TRUST_PROXY_HOPS) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS))
app.disable('x-powered-by')
app.use(helmet({
  strictTransportSecurity: production,
  contentSecurityPolicy: production ? { directives: {
    scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'],
    'upgrade-insecure-requests': base.startsWith('https:') ? [] : null
  } } : false
}))
app.use(express.json({ limit: '250kb' }))
app.use(cookieParser())
const vite = production ? null : await (await import('vite')).createServer({
  root, server: { middlewareMode: true, ws: { server } }, appType: 'custom'
})
const renderProd = production ? (await import('../dist/ssr/entry-server.js')).render : null
const template = production ? await readFile(new URL('../dist/index.html', import.meta.url), 'utf8') : null
const escape = input => String(input).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const json = input => JSON.stringify(input).replace(/</g, '\\u003c')
const staticRoutes = ['', '/about', '/services', '/tutoring', '/blog', '/testimonials', '/contact', '/faq', '/academic-integrity', '/privacy', '/terms', '/cookies']

publicEnquiries(app, base, production)
app.get('/api/content', async (_req, res) => res.json(await readContent()))
app.get('/robots.txt', (_req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ' + base + '/sitemap.xml\n'))
app.get('/sitemap.xml', async (_req, res) => {
  const content = await readContent()
  const items = [...staticRoutes, ...['services','tutoring','posts'].flatMap(key => content[key].map(item => '/' + (key === 'posts' ? 'blog' : key) + '/' + item.slug))]
  const subjects = new Map(content.tutoring.map(subject => [categoryKey(subject), subject.slug]))
  items.push(...content.topics.map(topic => topicPath(subjects.get(topic.categoryId), topic)))
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + items.map(path => '<url><loc>' + escape(base + (path || '/')) + '</loc></url>').join('') + '</urlset>')
})
app.get('/media/:id', async (req, res) => {
  if (!connected() || !/^[a-f0-9]{32}$/.test(req.params.id)) return res.sendStatus(404)
  const image = await Image.findById(req.params.id)
  if (!image) return res.sendStatus(404)
  res.type('image/webp').set('Cache-Control', 'public,max-age=31536000,immutable').send(image.data)
})
const admin = express.Router()
app.use('/api/admin', admin)
admin.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const localOrigin = 'http://' + req.get('host')
    if (req.get('origin') !== base && ((production && base.startsWith('https:')) || req.get('origin') !== localOrigin)) {
      return res.status(403).json({ error: 'Request origin is not allowed.' })
    }
  }
  if (!connected()) return res.status(503).json({ error: 'The content database is unavailable.' })
  next()
})
admin.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, skipSuccessfulRequests: true, message: { error: 'Too many sign-in attempts. Try again later.' } }), (req, res) => login(req, res, production && base.startsWith('https:')))
admin.use(requireAdmin)
adminEnquiries(admin)
admin.get('/session', (_req, res) => res.json({ authenticated: true }))
admin.post('/logout', (req, res) => logout(req, res, production && base.startsWith('https:')))
admin.get('/content', async (_req, res) => {
  const data = await Promise.all(Object.values(models).map(model => model.find().sort({ order: 1, createdAt: -1 }).lean()))
  res.json({ ...Object.fromEntries(Object.keys(models).map((key, index) => [key, data[index]])), settings: await readSettings() })
})
const parse = (key, req, res) => {
  const result = validators[key].safeParse(req.body)
  if (result.success) return result.data
  res.status(422).json({ error: result.error.issues.map(issue => issue.path.join('.') + ' — ' + issue.message).join(' ') })
}
admin.post('/preview', (req, res) => {
  const data = parse('posts', req, res)
  if (data) res.json(data)
})
admin.post('/preview-topic', async (req, res) => {
  const data = parse('topics', req, res)
  if (!data) return
  if (!(await models.tutoring.exists({ _id: data.categoryId }))) return res.status(422).json({ error: 'Choose an existing tutoring category.' })
  res.json(data)
})
admin.put('/settings', async (req, res) => {
  const data = parse('settings', req, res)
  if (data) res.json(await Settings.findByIdAndUpdate('site', { $set: data }, { upsert: true, new: true }))
})
for (const [key, model] of Object.entries(models)) {
  admin.post('/' + key, async (req, res) => {
    const data = parse(key, req, res)
    if (!data) return
    if (key === 'posts' && data.published) data.publishedAt = new Date()
    if (key === 'topics' && !(await models.tutoring.exists({ _id: data.categoryId }))) return res.status(422).json({ error: 'Choose an existing tutoring category.' })
    const created = await model.create(data)
    if (key === 'tutoring') await seedTopics(created)
    res.status(201).json(created)
  })
  admin.put('/' + key + '/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.sendStatus(404)
    const data = parse(key, req, res)
    if (!data) return
    const current = await model.findById(req.params.id)
    if (!current) return res.sendStatus(404)
    if (key === 'posts' && data.published && !current.publishedAt) data.publishedAt = new Date()
    if (key === 'topics' && (data.slug !== current.slug || data.categoryId !== current.categoryId)) {
      return res.status(422).json({ error: 'The topic URL slug and category are fixed after creation.' })
    }
    const added = key === 'tutoring' ? data.topics.filter(title => !current.topics.includes(title)) : []
    current.set(data)
    if (key === 'tutoring') await seedTopics(current, added)
    res.json(await current.save())
  })
  admin.delete('/' + key + '/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.sendStatus(404)
    if (!(await model.findByIdAndDelete(req.params.id))) return res.sendStatus(404)
    res.status(204).end()
  })
}
admin.post('/images', multer({ limits: { fileSize: 6 * 1024 * 1024, files: 1 } }).single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose an image.' })
  let data
  try {
    const image = sharp(req.file.buffer, { limitInputPixels: 18000000 })
    if (!['jpeg','png','webp'].includes((await image.metadata()).format)) throw new Error()
    data = await image.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 83 }).toBuffer()
  } catch {
    return res.status(422).json({ error: 'Choose a valid JPEG, PNG or WebP image.' })
  }
  const id = randomBytes(16).toString('hex')
  await Image.create({ _id: id, data })
  res.status(201).json({ url: '/media/' + id })
})
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }))
if (vite) app.use(vite.middlewares)
else app.use('/assets', express.static(root + 'dist/assets', { maxAge: '1y', immutable: true }))
app.use('/licenses', express.static(root + (production ? 'dist/licenses' : 'public/licenses')))
app.use('/images', express.static(root + (production ? 'dist/images' : 'public/images'), { maxAge: '1d' }))
app.get(/.*/, async (req, res) => {
  if (req.path.startsWith('/assets/') || req.path.startsWith('/media/') || req.path.startsWith('/images/')) return res.sendStatus(404)
  const render = renderProd ?? (await vite.ssrLoadModule('/src/entry-server.tsx')).render
  const html = template ?? await vite.transformIndexHtml(req.originalUrl, await readFile(root + 'index.html', 'utf8'))
  const isAdmin = /^\/admin(?:\/|$)/.test(req.path)
  let content
  let unavailable = false
  if (!isAdmin) {
    try { content = await readContent() } catch { unavailable = true }
  }
  const legacy = /^\/tutoring\/([^/]+)\/([^/]+)\/?$/.exec(req.path)
  if (legacy && content) {
    const subject = content.tutoring.find(item => item.slug === legacy[1])
    const topic = subject && content.topics.find(item => item.categoryId === categoryKey(subject) && encodeURIComponent(item.title) === legacy[2])
    const canonical = subject && content.topics.some(item => item.categoryId === categoryKey(subject) && item.slug === legacy[2])
    if (topic && !canonical) return res.redirect(301, topicPath(subject.slug, topic) + new URL(req.originalUrl, base).search)
  }
  const { markup, meta, status } = render(req.originalUrl, content, unavailable, base)
  const canonical = base + (req.path.replace(/\/+$/, '') || '/')
  const title = escape(meta.title)
  const description = escape(meta.description)
  const image = escape(base + (meta.image || '/images/library.jpg'))
  const head = '<title>' + title + '</title><meta name="description" content="' + description + '">' +
    '<link rel="canonical" href="' + escape(canonical) + '">' +
    '<meta property="og:title" content="' + title + '"><meta property="og:description" content="' + description + '">' +
    '<meta property="og:url" content="' + escape(canonical) + '"><meta property="og:image" content="' + image + '">' +
    '<meta property="og:type" content="' + (meta.article ? 'article' : 'website') + '"><meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + title + '"><meta name="twitter:description" content="' + description + '"><meta name="twitter:image" content="' + image + '">' +
    (status !== 200 || isAdmin ? '<meta name="robots" content="noindex">' : '<script type="application/ld+json">' + json({
      '@context': 'https://schema.org', '@type': meta.article ? 'BlogPosting' : meta.service ? 'Service' : 'WebPage',
      url: canonical, name: meta.title, description: meta.description,
      ...(meta.article ? { headline: meta.title, datePublished: meta.article.publishedAt, author: { '@type': 'Person', name: meta.article.author }, image: base + (meta.image || '/images/library.jpg') } : {})
    }) + '</script>')
  res.status(status).type('html').send(html.replace('<!--meta-->', () => head).replace('<!--app-->', () => markup)
    .replace('<!--data-->', () => '<script id="site-data" type="application/json">' + json({ content, unavailable, base }) + '</script>'))
})
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  if (err.code === 11000) return res.status(409).json({ error: 'That slug is already in use.' })
  if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Upload one image up to 6 MB.' })
  if (err.status === 400 || err.status === 413) return res.status(err.status).json({ error: 'Invalid or oversized request.' })
  console.error('Request failed:', err.name)
  if (req.path.startsWith('/api/') || req.path.startsWith('/media/')) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
  res.status(500).type('html').send('<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>ResearchMaker | Something went wrong</title><main><h1>Please try again shortly.</h1><p>The website was unable to load this page.</p><a href="/">Return to ResearchMaker</a></main></html>')
})
server.listen(port, process.env.HOST ?? (production ? '0.0.0.0' : '127.0.0.1'), () => console.log('Local http://localhost:' + server.address().port))
