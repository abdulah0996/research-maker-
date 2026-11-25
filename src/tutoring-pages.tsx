import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, ChevronRight, ClipboardList, Compass, MessageCircle } from 'lucide-react'
import { categoryKey, topicPath } from '../shared/topic-routes.mjs'
import { EditorialImage } from './editorial-media'
import { PhotoHero } from './photo-hero'
import { topicLearning, topicWalkthroughs } from './topic-learning'
import { topicPhoto } from './topic-photography'
import { subjectProfile } from './subject-profiles'
import { Chat, Questions, useSite } from './ui'
import type { Subject, Topic } from './types'
import './tutoring-pages.css'

export const topicsFor = (topics: Topic[], subject: Subject) => topics.filter(topic => topic.categoryId === categoryKey(subject))

function TopicImage({ subject, topic, card = false }: { subject: Subject; topic: Topic; card?: boolean }) {
  const photo = topicPhoto(subject, topic)
  const configured = card ? topic.cardImage || topic.image : topic.image
  const alt = card && topic.cardImage ? topic.cardAlt : topic.alt
  const [failed, setFailed] = useState('')
  const showUpload = configured && configured !== failed
  const image = showUpload ? configured : photo.src
  if (image === failed) return <EditorialImage item={subject} eager={!card}/>
  return <img src={image} alt={showUpload ? alt || topic.title : photo.alt} loading={card ? 'lazy' : 'eager'}
    decoding="async" ref={node => { if (node?.complete && node.naturalWidth === 0) setFailed(image) }}
    onError={() => setFailed(image)}/>
}

function Breadcrumbs({ subject, topic }: { subject: Subject; topic?: Topic }) {
  return <nav className="wrap tutor-crumbs" aria-label="Breadcrumb">
    <Link to="/">Home</Link><ChevronRight size={14} aria-hidden/><Link to="/tutoring">Tutoring</Link><ChevronRight size={14} aria-hidden/>
    {topic ? <><Link to={'/tutoring/' + subject.slug}>{subject.title}</Link><ChevronRight size={14} aria-hidden/><span aria-current="page">{topic.title}</span></> : <span aria-current="page">{subject.title}</span>}
  </nav>
}

function TutorHero({ subject, topic }: { subject: Subject; topic?: Topic }) {
  return <PhotoHero image={topic ? <TopicImage subject={subject} topic={topic}/> : <EditorialImage item={subject} eager/>}>
    <Breadcrumbs subject={subject} topic={topic}/>
    <div className="wrap tutor-hero-grid">
      <div className="tutor-hero-copy">
        <span className="kicker">{topic ? subject.title : 'Tutoring subjects'}</span>
        <h1>{topic ? topic.title + ' Tutoring' : subject.title}</h1>
        <p className="lede">{topic?.summary || subject.summary}</p>
        <div className="actions">
          {!topic && <a href="#topics" className="button">Explore topics <ChevronRight size={18}/></a>}
          <Chat enquiry={(topic?.title || subject.title) + ' tutoring'} label={topic ? 'Enquire About ' + topic.title : undefined} className={topic ? undefined : 'outline'}/>
        </div>
      </div>
    </div>
  </PhotoHero>
}

function TopicCards({ subject, topics, enquiries = false }: { subject: Subject; topics: Topic[]; enquiries?: boolean }) {
  return <div className="grid three tutor-card-grid">
    {topics.map(topic => <article className="card tutor-topic-card" key={topic.slug}>
      <Link className="topic-card-link" to={topicPath(subject.slug, topic)}>
        <div className="topic-card-photo"><TopicImage subject={subject} topic={topic} card/></div>
        <div className="topic-card-copy">
          <h3>{topic.title}</h3><p>{topic.summary}</p>
          <span className="text-link">Explore topic <ArrowUpRight size={16} aria-hidden/></span>
        </div>
      </Link>
      {enquiries && <div className="topic-card-enquiry"><Chat className="compact-chat" enquiry={topic.title + ' tutoring'}/></div>}
    </article>)}
  </div>
}

const relatedGroups = [
  ['it-computer-science', 'engineering', 'research-methods-data-analysis', 'mathematics-statistics', 'physical-natural-sciences', 'medical-health-sciences'],
  ['business-management', 'accounting-finance-economics', 'professional-career-skills'],
  ['arts-media-design', 'english-literature-languages', 'humanities-social-sciences', 'law-llb'],
  ['school-college-subjects', 'test-exam-preparation', 'english-literature-languages', 'mathematics-statistics']
]

const steps = [
  [Compass, 'Select your subject', 'Choose a topic and identify a concept or skill you want to work on.'],
  [MessageCircle, 'Discuss your requirements', 'Use WhatsApp to share your current level, module and priorities.'],
  [ClipboardList, 'Agree a focus', 'ResearchMaker can discuss suitable support and tailor the work to your needs.'],
  [BookOpen, 'Build understanding', 'Work through a structured example, review your reasoning and practise independently.']
] as const

export function TutoringDetail({ item }: { item: Subject }) {
  const { content } = useSite()
  const topics = topicsFor(content.topics, item)
  const [about, ...outcomes] = subjectProfile(item.slug, item.summary)
  const preferred = relatedGroups.find(group => group.includes(item.slug)) ?? []
  const related = [...content.tutoring].filter(subject => subject.slug !== item.slug)
    .sort((left, right) => Number(preferred.includes(right.slug)) - Number(preferred.includes(left.slug))).slice(0, 3)
  const faqs = item.faq?.length ? item.faq : [
    { q: 'Which ' + item.title + ' topics can I explore?', a: topics.length ? 'Start with ' + topics.slice(0, 3).map(topic => topic.title).join(', ') + ', or browse the complete list on this page.' : 'Tell ResearchMaker which part of the subject you are studying and ask about suitable support.' },
    { q: 'Can I focus on one module or skill?', a: 'Yes. Share your module outline and a specific difficulty. A useful goal in this category is to ' + outcomes[0].replace(/\.$/, '').replace(/^./, letter => letter.toLowerCase()) + '.' },
    { q: 'What should I include in my enquiry?', a: 'Tell us the topic, your current level and what you want to understand. Mention any syllabus or course-specific requirements so we can confirm suitability.' }
  ]
  return <>
    <TutorHero subject={item}/>
    <section className="section wrap tutor-editorial tutor-topic-editorial">
      <div><span className="kicker">About the subject</span><h2>Studying {item.title}</h2><p className="lede">{about}</p></div>
      <aside><h2>Skills and learning outcomes</h2><ul className="check-list">{outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul></aside>
    </section>
    <section className="section tutor-tinted" id="topics"><div className="wrap">
      <h2>Topics we cover</h2>
      {topics.length ? <TopicCards subject={item} topics={topics} enquiries/> : <p>Ask ResearchMaker about tutoring in this subject.</p>}
    </div></section>
    <section className="section wrap">
      <div><h2>How tutoring works</h2><ol className="tutor-steps">{steps.map(([Icon,title,copy]) => <li key={title}><Icon size={20} aria-hidden/><div><h3>{title}</h3><p>{copy}</p></div></li>)}</ol></div>
    </section>
    <section className="section tutor-tinted"><div className="wrap"><h2>Frequently asked questions</h2><Questions items={faqs}/></div></section>
    {related.length > 0 && <section className="section wrap"><h2>Related tutoring subjects</h2><div className="grid three tutor-card-grid">
      {related.map(subject => <article key={subject.slug} className="card tutor-topic-card"><Link className="topic-card-link" to={'/tutoring/' + subject.slug}>
        <div className="topic-card-photo"><EditorialImage item={subject}/></div><div className="topic-card-copy"><h3>{subject.title}</h3><p>{subject.summary}</p></div>
      </Link></article>)}
    </div></section>}
  </>
}

export function TopicDetail({ item, topic }: { item: Subject; topic: Topic }) {
  const { content } = useSite()
  const notes = topic.learningNotes?.length ? topic.learningNotes : topicLearning[topic.slug] ?? []
  const walkthrough = topicWalkthroughs[topic.slug]
  const peers = topicsFor(content.topics, item).filter(other => other.slug !== topic.slug)
  const selected = topic.related?.flatMap(slug => peers.filter(other => other.slug === slug)) ?? []
  const position = peers.findIndex(other => (other.order ?? 0) > (topic.order ?? 0))
  const nearby = position < 0 ? peers.slice(-3) : peers.slice(Math.max(0, position - 1), position + 2)
  const related = (selected.length ? selected : nearby).slice(0, 3)
  return <>
    <TutorHero subject={item} topic={topic}/>
    <nav className="topic-jump" aria-label="On this page"><div className="wrap"><a href="#topic-overview">Overview</a><a href="#topic-modules">Learning modules</a><a href="#topic-practice">Practice</a><a href="#topic-faq">FAQs</a><a href="#topic-enquiry">Enquire</a></div></nav>
    <section className="section wrap tutor-editorial tutor-topic-editorial" id="topic-overview">
      <div><span className="kicker">Subject overview</span><h2>What is {topic.title}?</h2><p className="lede">{topic.description}</p></div>
      <aside><h2>Who this is for</h2><p>{topic.audience}</p></aside>
    </section>
    <section className="section tutor-tinted" id="topic-modules"><div className="wrap">
      <h2>What you’ll explore</h2><ul className="grid tutor-areas">{topic.areas.map((area, index) => {
        const separator = area.indexOf(': ')
        return <li key={area}><h3>{separator < 0 ? ["Core concepts", "Applying the material", "Checking your reasoning"][index] ?? "Learning area " + (index + 1) : area.slice(0, separator)}</h3><p>{separator < 0 ? area : area.slice(separator + 2)}</p></li>
      })}</ul>
    </div></section>
    <section className="section wrap tutor-study" id="topic-practice">
      <div><h2>Skills you’ll develop</h2><ul className="check-list">{topic.skills.map(skill => <li key={skill}>{skill}</li>)}</ul></div>
      <div><h2>What you can practise</h2>{topic.activities.map(activity => <p key={activity} className="lede">{activity}</p>)}
      {walkthrough && <article className="topic-walkthrough"><h3>{walkthrough[0]}</h3><ol>{walkthrough.slice(1).map(step => <li key={step}>{step}</li>)}</ol></article>}</div>
    </section>
    {notes.length > 0 && <section className="section tutor-tinted"><div className="wrap"><h2>Build your understanding</h2><ul className="check-list">{notes.map(note => <li key={note}>{note}</li>)}</ul></div></section>}
    {related.length > 0 && <section className="section wrap"><h2>Related topics</h2><TopicCards subject={item} topics={related}/></section>}
    <section className="section tutor-tinted" id="topic-faq"><div className="wrap"><h2>Frequently asked questions</h2><Questions items={topic.faq ?? []}/></div></section>
    <section className="final cinematic-final" id="topic-enquiry"><div className="wrap"><h2>Discuss {topic.title} tutoring</h2><Chat enquiry={topic.title + ' tutoring'} label={'Enquire About ' + topic.title} className="light"/></div></section>
  </>
}
