import mongoose from 'mongoose'

const { Schema } = mongoose
const faq = [{ q: String, a: String, _id: false }]
const model = (name, fields, options) => mongoose.model(name, new Schema(fields, options))
const catalogue = {
  title: String, slug: { type: String, unique: true }, summary: String,
  image: String, alt: String, faq, order: Number, published: Boolean,
  metaTitle: String, metaDescription: String
}

const topicSchema = new Schema({
  ...catalogue, slug: { type: String, required: true }, categoryId: { type: String, required: true },
  description: String, cardImage: String, cardAlt: String, areas: [String], skills: [String], activities: [String], audience: String,
  related: [String], learningNotes: [String]
}, { timestamps: true })
topicSchema.index({ categoryId: 1, slug: 1 }, { unique: true })

export const models = {
  topics: mongoose.model('TutoringTopic', topicSchema),
  services: model('Service', { ...catalogue, description: String, areas: [String], areaDetails: [String], guideExample: String, guideBring: String, guideOutcome: String, guideBoundary: String, audience: String, process: String }, { timestamps: true }),
  tutoring: model('SubjectCategory', { ...catalogue, topics: [String] }, { timestamps: true }),
  posts: model('Post', {
    ...catalogue, body: String, author: String, category: String, tags: [String], featured: Boolean, publishedAt: Date
  }, { timestamps: true }),
  testimonials: model('Testimonial', {
    name: String, review: String, rating: Number, service: String, approved: Boolean, date: String
  }, { timestamps: true })
}
export const Settings = model('Settings', {
  _id: String, name: String, email: String, whatsapp: String, message: String,
  heroTitle: String, heroText: String, heroComputingImage: String, heroHealthImage: String, heroLawImage: String, heroResearchImage: String,
  introText: String, footerText: String, seoTitle: String, seoDescription: String, socials: [String]
})
export const Admin = model('Admin', { email: { type: String, unique: true }, password: String })
export const Session = model('Session', {
  _id: String, admin: { type: Schema.Types.ObjectId, required: true },
  expires: { type: Date, expires: 0 }
})
export const Image = model('Image', { _id: String, data: Buffer })
