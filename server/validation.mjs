import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'
import { categories } from '../shared/catalog.mjs'

const line = z.string().trim().min(1).max(180)
const copy = z.string().trim().min(1).max(12000)
const optional = z.string().trim().max(250).default('')
const image = z.string().max(400).regex(/^(?:\/(?:images\/(?:editorial\/)?[a-z0-9-]+\.(?:jpg|webp)|media\/[a-f0-9]{32})|)$/).default('')
const common = {
  title: line, slug: z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), summary: z.string().trim().min(1).max(500),
  image, alt: optional, metaTitle: optional, metaDescription: optional, published: z.boolean().default(false),
  order: z.number().int().min(0).max(10000).default(0),
  faq: z.array(z.object({ q: line, a: copy })).max(30).default([])
}
const optionalGuide = z.string().trim().max(2000).optional()

export const validators = {
  services: z.object({ ...common, description: copy, audience: copy, process: copy, areas: z.array(line).min(1).max(100), areaDetails: z.array(copy).max(100).optional(), guideExample: optionalGuide, guideBring: optionalGuide, guideOutcome: optionalGuide, guideBoundary: optionalGuide }),
  tutoring: z.object({ ...common, topics: z.array(line).min(1).max(150) }),
  topics: z.object({
    ...common, categoryId: z.string().regex(/^[a-f0-9]{24}$/), description: copy,
    cardImage: image, cardAlt: optional, audience: copy, areas: z.array(copy).min(1).max(25),
    skills: z.array(copy).min(1).max(25), activities: z.array(copy).min(1).max(25),
    related: z.array(line).max(12).default([]), learningNotes: z.array(copy).max(20).optional(),
    faq: common.faq.refine(items => items.length >= 4 && items.length <= 6, 'Provide four to six questions.')
  }),
  posts: z.object({
    ...common, author: line, category: z.enum(categories), tags: z.array(line).max(30), featured: z.boolean().default(false),
    body: z.string().max(150000).transform(html => sanitizeHtml(html, {
      allowedTags: ['p','h2','h3','h4','ul','ol','li','strong','em','s','blockquote','a','code','pre','br','hr'],
      allowedAttributes: { a: ['href'] }, allowedSchemes: ['http','https','mailto'], allowProtocolRelative: false
    })).refine(html => sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim().length > 0, 'Enter article content.')
  }),
  testimonials: z.object({
    name: line, review: copy, rating: z.number().int().min(1).max(5).nullable(),
    service: line, approved: z.boolean(), date: z.iso.date()
  }),
  settings: z.object({
    name: line, email: z.union([z.email(), z.literal('')]), whatsapp: z.string().regex(/^(?:\+?[1-9]\d{7,14})?$/).transform(v => v.replace(/^\+/, '')),
    message: z.string().trim().min(1).max(1200), heroTitle: z.string().trim().min(1).max(200),
    heroComputingImage: image, heroHealthImage: image, heroLawImage: image, heroResearchImage: image,
    heroText: copy, introText: copy, footerText: copy, seoTitle: line, seoDescription: line,
    socials: z.array(z.url({ protocol: /^https$/ })).max(10)
  })
}
