import mongoose from 'mongoose'
import { models, Settings } from './models.mjs'
import { services, tutoring, settings } from '../shared/catalog.mjs'

import { categoryKey } from '../shared/topic-routes.mjs'
import { defaultTopics, makeTopics } from '../shared/topics.mjs'

export const connected = () => mongoose.connection.readyState === 1
export async function seedTopics(subject, titles = subject.topics) {
  const allowed = new Set(titles)
  const records = makeTopics(subject).filter(topic => allowed.has(topic.title))
  if (!records.length) return
  await models.topics.bulkWrite(records.map(record => ({
    updateOne: { filter: { categoryId: record.categoryId, slug: record.slug }, update: { $setOnInsert: record }, upsert: true, timestamps: false }
  })))
}
export async function seedCatalogue() {
  for (const [key, records] of Object.entries({ services, tutoring })) {
    const marker = 'seed:' + key
    if (await Settings.exists({ _id: marker })) continue
    await models[key].bulkWrite(records.map(record => ({
      updateOne: { filter: { slug: record.slug }, update: { $setOnInsert: record }, upsert: true, timestamps: false }
    })))
    await Settings.updateOne({ _id: marker }, { $setOnInsert: { name: marker } }, { upsert: true })
  }
  const marker = 'seed:tutoring-topics-v1'
  if (!(await Settings.exists({ _id: marker }))) {
    for await (const subject of models.tutoring.find().lean().cursor()) await seedTopics(subject)
    await Settings.updateOne({ _id: marker }, { $setOnInsert: { name: marker } }, { upsert: true })
  }
}
export async function readSettings() {
  const saved = connected() ? await Settings.findById('site').lean() : null
  const result = Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, saved?.[key] ?? value]))
  result.whatsapp ||= process.env.WHATSAPP_NUMBER?.replace(/^\+/, '') ?? ''
  result.email ||= process.env.CONTACT_EMAIL ?? ''
  return result
}
export async function readContent() {
  const site = await readSettings()
  if (!connected()) {
    if (process.env.MONGODB_URI) throw new Error('Content database unavailable')
    return { services, tutoring, topics: defaultTopics, posts: [], testimonials: [], settings: site }
  }
  const [allServices, subjects, posts, testimonials, publishedTopics] = await Promise.all([
    models.services.find({ published: true }).sort({ order: 1, title: 1 }).lean(),
    models.tutoring.find({ published: true }).sort({ order: 1, title: 1 }).lean(),
    models.posts.find({ published: true }).sort({ publishedAt: -1 }).lean(),
    models.testimonials.find({ approved: true }).sort({ date: -1 }).lean(),
    models.topics.find({ published: true }).sort({ order: 1, title: 1 }).lean()
  ])
  const visible = new Set(subjects.map(categoryKey))
  const topics = publishedTopics.filter(topic => visible.has(topic.categoryId))
  return { services: allServices, tutoring: subjects, topics, posts, testimonials, settings: site }
}
