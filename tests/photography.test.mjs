import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tutoring, services } from '../shared/catalog.mjs'
import { defaultTopics } from '../shared/topics.mjs'
import { topicPath } from '../shared/topic-routes.mjs'
import { startServer } from './support.mjs'

const topicRoutes = new Set(defaultTopics.map(topic => topicPath(topic.categoryId, topic)))
const routes = [
  '/', '/about', '/services', '/tutoring', '/blog', '/testimonials', '/contact', '/faq',
  '/privacy', '/terms', '/cookies', '/academic-integrity', '/admin',
  ...services.map(item => '/services/' + item.slug),
  ...tutoring.map(item => '/tutoring/' + item.slug),
  ...topicRoutes
]

test('default public pages have distinct in-page photos and every topic has its own hero', { timeout: 90000 }, async () => {
  const site = await startServer()
  try {
    const assets = new Set()
    const heroPhotos = new Set()
    for (let index = 0; index < routes.length; index += 16) await Promise.all(routes.slice(index, index + 16).map(async route => {
      const response = await fetch(site.url + route)
      assert.equal(response.status, 200, route)
      const html = await response.text()
      const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? ''
      const sources = [...main.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1])
      assert.equal(new Set(sources).size, sources.length, 'Repeated photo on ' + route)
      if (topicRoutes.has(route)) {
        const hero = main.match(/class="photo-hero-image"[^>]*><img[^>]*\bsrc="([^"]+)"/)?.[1]
        assert.ok(hero, 'Missing hero on ' + route)
        assert.ok(!heroPhotos.has(hero), 'Shared topic hero at ' + route)
        heroPhotos.add(hero)
      }
      for (const path of sources) assets.add(path)
    }))
    const paths = [...assets]
    for (let index = 0; index < paths.length; index += 16) {
      await Promise.all(paths.slice(index, index + 16).map(async path => {
        const response = await fetch(site.url + path)
        assert.equal(response.status, 200, path)
        assert.match(response.headers.get('content-type'), /^image\//, path)
        await response.arrayBuffer()
      }))
    }
    assert.equal(heroPhotos.size, defaultTopics.length)
  } finally {
    await site.stop()
  }
})
