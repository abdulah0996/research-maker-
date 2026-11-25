import mongoose from 'mongoose'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { connected } from './content.mjs'
import { models } from './models.mjs'

const statuses = ['New', 'Contacted', 'In Progress', 'Closed']
const submission = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(254),
  phone: z.string().trim().max(30).regex(/^\+[1-9][\d ()-]+$/).transform(value => value.replace(/[ ()-]/g, '')).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
  service: z.string().max(110),
  subject: z.string().max(110),
  message: z.string().trim().min(10).max(1600),
  privacy: z.literal(true),
  website: z.literal('').default('')
})
const schema = new mongoose.Schema({
  name: String, email: String, phone: String, service: String, subject: String, message: String,
  privacy: Boolean, status: { type: String, enum: statuses, default: 'New' }
}, { timestamps: true })
schema.index({ status: 1, createdAt: -1 })
const Enquiry = mongoose.model('Enquiry', schema)

async function notifyOwner(id, date) {
  const { RESEND_API_KEY, ENQUIRY_NOTIFY_FROM, ENQUIRY_NOTIFY_TO } = process.env
  if (!RESEND_API_KEY || !ENQUIRY_NOTIFY_FROM || !ENQUIRY_NOTIFY_TO) return
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { Authorization: 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: ENQUIRY_NOTIFY_FROM, to: [ENQUIRY_NOTIFY_TO],
        subject: 'New ResearchMaker enquiry',
        text: 'Enquiry ' + id + ' was received at ' + date.toISOString() + '. Sign in to the ResearchMaker dashboard to view it.'
      })
    })
    if (!response.ok) console.warn('Enquiry notification provider returned HTTP ' + response.status)
  } catch {
    console.warn('Enquiry notification could not be sent.')
  }
}

export function publicEnquiries(app, base, production) {
  app.post('/api/enquiries', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 6, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many enquiries. Please try again later.' }
  }), async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const origin = req.get('origin')
    if (origin !== base && ((production && base.startsWith('https:')) || origin !== 'http://' + req.get('host'))) {
      return res.status(403).json({ error: 'Request origin is not allowed.' })
    }
    if (!req.is('application/json')) return res.status(415).json({ error: 'Send the enquiry as JSON.' })
    const result = submission.safeParse(req.body)
    if (!result.success) return res.status(422).json({ error: 'Check your name, email, international WhatsApp number, message and privacy acknowledgement.' })
    if (!connected()) return res.status(503).json({ error: 'The enquiry form is temporarily unavailable. You can still contact us directly on WhatsApp.' })
    const { website, ...data } = result.data
    const [service, subject] = await Promise.all([
      data.service && models.services.exists({ slug: data.service, published: true }),
      data.subject && models.tutoring.exists({ slug: data.subject, published: true })
    ])
    if ((data.service && !service) || (data.subject && !subject)) return res.status(422).json({ error: 'Choose a listed service and subject.' })
    const saved = await Enquiry.create(data)
    res.status(201).json({ reference: saved.id })
    void notifyOwner(saved.id, saved.createdAt)
  })
}

export function adminEnquiries(router) {
  router.get('/enquiries', async (req, res) => {
    const status = req.query.status
    if (status !== undefined && !statuses.includes(status)) return res.status(400).json({ error: 'Invalid status filter.' })
    const page = z.coerce.number().int().min(1).max(10000).safeParse(req.query.page ?? 1)
    if (!page.success) return res.status(400).json({ error: 'Invalid page.' })
    const filter = status ? { status } : {}
    const rows = await Enquiry.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page.data - 1) * 30).limit(31).lean()
    res.json({ items: rows.slice(0, 30), more: rows.length > 30 })
  })
  router.patch('/enquiries/:id', async (req, res) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.sendStatus(404)
    const result = z.object({ status: z.enum(statuses) }).strict().safeParse(req.body)
    if (!result.success) return res.status(422).json({ error: 'Invalid enquiry status.' })
    if (!(await Enquiry.findByIdAndUpdate(req.params.id, { $set: result.data }))) return res.sendStatus(404)
    res.sendStatus(204)
  })
}
