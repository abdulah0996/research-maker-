import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryKey, topicPath } from '../shared/topic-routes.mjs'
import { Chat, useSite } from './ui'

const levels = ['School or college', 'University', 'Postgraduate', 'Independent learning']
const support = [
  { label: 'Understand the subject', slug: 'academic-tutoring' },
  { label: 'Improve my writing', slug: 'academic-writing-coaching' },
  { label: 'Plan research', slug: 'academic-research-support' },
  { label: 'Develop my code', slug: 'it-project-mentoring-and-code-review' }
]

export function LearningPath() {
  const { content } = useSite()
  const [category, setCategory] = useState('')
  const [topicSlug, setTopic] = useState('')
  const [level, setLevel] = useState('')
  const [need, setNeed] = useState(support[0].slug)
  const subject = content.tutoring.find(item => item.slug === category)
  const topics = subject ? content.topics.filter(item => item.categoryId === categoryKey(subject)) : []
  const topic = topics.find(item => item.slug === topicSlug)
  const service = content.services.find(item => item.slug === need)
  const title = topic?.title ?? subject?.title
  const href = subject ? (topic ? topicPath(subject.slug, topic) : '/tutoring/' + subject.slug) : ''
  const enquiry = [title ? title + ' support' : service?.title, level ? 'at ' + level.toLowerCase() + ' level' : '', service && need !== 'academic-tutoring' && title ? 'with ' + service.title.toLowerCase() : ''].filter(Boolean).join(' ')

  return <section className="section guidance-band" id="learning-path"><div className="wrap guidance-layout">
    <div><span className="kicker">Learning path finder</span><h2>Find your learning path</h2><p className="lede">Choose what you are studying and the kind of support you need.</p>
      <div className="enquiry-form path-controls">
        <label htmlFor="path-category">Subject category</label>
        <select id="path-category" value={category} onChange={event => { setCategory(event.target.value); setTopic('') }}><option value="">Choose a category</option>{content.tutoring.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select>
        <label htmlFor="path-topic">Topic</label>
        <select id="path-topic" value={topicSlug} disabled={!topics.length} onChange={event => setTopic(event.target.value)}><option value="">Any topic in this category</option>{topics.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select>
        <label htmlFor="path-level">Learning level</label>
        <select id="path-level" value={level} onChange={event => setLevel(event.target.value)}><option value="">Choose your level</option>{levels.map(item => <option key={item}>{item}</option>)}</select>
        <label htmlFor="path-need">Type of support</label>
        <select id="path-need" value={need} onChange={event => setNeed(event.target.value)}>{support.map(item => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select>
      </div>
    </div>
    <div className="guidance-panel">
      <div aria-live="polite"><h3>{title ?? service?.title ?? 'Explore your options'}</h3>
        <p>{topic?.summary ?? subject?.summary ?? service?.summary ?? 'Choose a subject or browse the services to find a starting point.'}</p>
        {level && <p>For {level.toLowerCase()}, share your current level and a question or example you want to work on.</p>}
        {title && service && need !== 'academic-tutoring' && <p><strong>Related service:</strong> {service.title}</p>}
      </div>
      <div className="actions">
        {href && <Link className="button" to={href}>{topic ? 'Explore topic' : 'Explore subject'}</Link>}
        {service && (!href || need !== 'academic-tutoring') && <Link className="text-link" to={'/services/' + service.slug}>View service</Link>}
        <Chat enquiry={enquiry || undefined} className="outline"/>
      </div>
    </div>
  </div></section>
}
