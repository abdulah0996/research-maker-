import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, ClipboardList, Search, MessageCircle } from 'lucide-react'
import { generalFaq, policies } from './content'
import { Chat, FinalCTA, formatDate, Intro, PostCard, Questions, Reveal, useSite } from './ui'
import { EditorialImage } from './editorial-media'
import { PhotoHero } from './photo-hero'
import { HomeHero } from './home-hero'
import { LearningPath } from './learning-path'
import { EnquiryForm } from './enquiry-form'
import { ServiceGuide, SupportFinder, TutoringPlanner } from './guidance-tools'
import { academicSubjectPhotos, sitePhotos } from './topic-photography'
import { TutoringScrollExplorer } from './tutoring-scroll-explorer'
import { topicPath } from '../shared/topic-routes.mjs'
import { topicsFor } from './tutoring-pages'
import type { Post, Service, Subject } from './types'

const steps = [
  [BookOpen, 'Explore a service', 'Find the support that fits what you are working on.'],
  [MessageCircle, 'Contact us on WhatsApp', 'Send an enquiry with a few details about your goals.'],
  [ClipboardList, 'Discuss your requirements', 'Talk through what you need and agree a suitable next step.']
] as const
const orderedSubjects = (subjects: Subject[]) => [...subjects].sort((a, b) => Number(b.slug === 'it-computer-science') - Number(a.slug === 'it-computer-science'))
const match = (value: string, term: string) => value.toLowerCase().includes(term.trim().toLowerCase())

function Steps({ tutoring = false }: { tutoring?: boolean }) {
  const journey = tutoring ? [
    [BookOpen, 'Explore a subject', 'Choose a subject and identify a topic or skill you want to develop.'],
    [MessageCircle, 'Discuss your requirements', 'Share your current level and learning goals on WhatsApp.'],
    [ClipboardList, 'Get personalised guidance', 'Agree a focus and work through examples at a pace that suits you.']
  ] as const : steps
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  useEffect(() => {
    const items = Array.from(track.current?.querySelectorAll("article") ?? [])
    let frame = 0
    const update = () => {
      frame = 0
      const line = innerHeight * .44
      const distances = items.map(item => {
        const bounds = item.getBoundingClientRect()
        return Math.abs(bounds.top + bounds.height / 2 - line)
      })
      const nearest = distances.indexOf(Math.min(...distances))
      if (nearest >= 0) setActive(nearest)
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener("scroll", queue, { passive: true })
    window.addEventListener("resize", queue)
    queue()
    return () => {
      window.removeEventListener("scroll", queue)
      window.removeEventListener("resize", queue)
      cancelAnimationFrame(frame)
    }
  }, [])
  return <section className="section process"><div className="wrap process-layout"><div><span className="kicker">How ResearchMaker works</span><h2>Start with a conversation.</h2>
    <div className="guidance-options" role="group" aria-label="Steps">{journey.map(([, title], index) => <button key={title} type="button" aria-pressed={active === index} onClick={() => {
      setActive(index)
      track.current?.querySelectorAll('article')[index]?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }}>{title}</button>)}</div></div><div className="process-track" ref={track}>{journey.map(([Icon,title,text], index) => <article key={title} data-active={active === index}><span className="icon"><Icon size={22}/></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>
}
export function Home() {
  const { content } = useSite()
  const subjects = orderedSubjects(content.tutoring)
  return <>
    <HomeHero/>
    <section className="intro-band"><Reveal className="wrap editorial-intro"><div><span className="kicker">About ResearchMaker</span><h2>Supporting ambition through knowledge.</h2><p className="lede">{content.settings.introText}</p><Link to="/about" className="text-link">Get to know ResearchMaker</Link></div><figure><img {...sitePhotos["home-intro"]} loading="lazy"/></figure></Reveal></section>
    <LearningPath/>
    <TutoringScrollExplorer subjects={subjects}/>
    <FeaturedComputing subject={subjects.find(item => item.slug === "it-computer-science")}/>
    <SupportFinder/>
    <section className="section tinted"><div className="wrap"><div className="section-head"><div><span className="kicker">Our services</span><h2>Support for your next step.</h2></div><Link className="text-link" to="/services">View all services</Link></div><ServiceCards items={content.services} featured/></div></section>
    <TutoringPlanner/>
    <Steps />
    <section className="section wrap split why editorial-why"><Reveal><img {...sitePhotos["home-guidance"]} loading="lazy"/></Reveal><div><span className="kicker">Why ResearchMaker</span><h2>Guidance shaped around you.</h2><dl className="why-details">
      <div><dt>Start from where you are</dt><dd>Bring the module, draft or exercise you are working on and tell us where you get stuck. We can discuss a starting point that fits your level.</dd></div>
      <div><dt>Apply the explanation yourself</dt><dd>Use a comparable example to see the reasoning in action, then try a new question or make your own revision.</dd></div>
      <div><dt>Get clear about scope</dt><dd>Discuss what kind of support is suitable before starting, including any rules your institution sets for assessed work.</dd></div>
    </dl></div></section>
    <section className="section tinted"><div className="wrap"><div className="section-head"><div><span className="kicker">Testimonials</span><h2>Feedback on our support.</h2></div><Link className="text-link" to="/testimonials">View testimonials</Link></div><Reviews limit={3}/></div></section>
    {content.posts.length > 0 ? <section className="section wrap"><div className="section-head"><div><span className="kicker">The journal</span><h2>Latest insights.</h2></div><Link className="text-link" to="/blog">Visit the journal</Link></div><div className="grid journal-grid">{content.posts.slice(0,3).map(post => <PostCard key={post.slug} post={post}/>)}</div></section> : <LearningResources/>}
    <section className="section wrap"><h2>Frequently asked questions</h2><Questions items={generalFaq}/></section>
    <FinalCTA />
  </>
}

function LearningResources() {
  return <section className="section wrap"><div className="guidance-heading"><span className="kicker">Learning resources</span><h2>Make your next study session more useful</h2></div>
    <dl className="guidance-cards">
      <div><dt>Practise retrieval</dt><dd>Close your notes and explain one concept from memory. Check what you missed and make that your next practice question.</dd></div>
      <div><dt>Compare two sources</dt><dd>Write down the claim, evidence and limits for each source. Decide where the sources agree and where the methods could explain a difference.</dd></div>
      <div><dt>Check your own draft</dt><dd>Underline the main claim in each paragraph. Check that the evidence supports it and that the source can be traced.</dd></div>
    </dl>
    <Link className="text-link" to="/blog">Visit the learning journal</Link>
  </section>
}

function FeaturedComputing({ subject }: { subject?: Subject }) {
  const { content } = useSite()
  if (!subject) return null
  const topics = topicsFor(content.topics, subject).slice(0, 4)
  return <section className="section wrap split why">
    <Reveal><img src="/images/topics/it-computer-science-javascript.webp" alt="Hands typing while code is open on a laptop" loading="lazy"/></Reveal>
    <div><span className="kicker">Featured tutoring</span><h2>{subject.title}</h2><p className="lede">{subject.summary} Bring a short piece of code or a problem you want to understand and work through the reasoning together.</p>
      <ul className="check-list">{topics.map(topic => <li key={topic.slug}><Link to={topicPath(subject.slug, topic)}>{topic.title}</Link></li>)}</ul>
      <Link to={'/tutoring/' + subject.slug} className="button">Explore computing tutoring</Link>
    </div>
  </section>
}
function ServiceCards({ items, featured = false }: { items: Service[]; featured?: boolean }) {
  return <div className={featured ? "grid three service-grid service-featured" : "grid three service-grid"}>{items.map(item => <Reveal key={item.slug} className="service-reveal"><article className="service-story service-linked-card">
    <EditorialImage item={item}/><div className="service-copy"><h3><Link to={"/services/" + item.slug}>{item.title}</Link></h3><p>{item.summary}</p>
    <div className="card-actions"><Link className="text-link" to={"/services/" + item.slug}>View service details <ArrowUpRight size={16} aria-hidden="true"/></Link><Chat enquiry={item.title} className="outline"/></div></div>
  </article></Reveal>)}</div>
}
export function ServiceIndex() {
  const { content } = useSite()
  return <><Intro kicker="Our services" title="Academic and professional support." text="Explore tutoring, research guidance, editing and skills development."/><SupportFinder/><section className="section wrap"><h2>All services</h2><ServiceCards items={content.services}/></section><FinalCTA/></>
}
export function ServiceDetail({item}: {item: Service}) {
  const { content } = useSite()
  if (item.slug === "academic-tutoring") return <AcademicTutoring item={item}/>
  const indexed = content.services.findIndex(service => service.slug === item.slug)
  const related = [...content.services.slice(indexed + 1), ...content.services.slice(0, indexed)].slice(0,3)
  return <><ServiceHero item={item}/>
    <div className="wrap section detail"><article className="prose"><h2>What you can work on</h2><p>{item.description}</p><h2>Who it’s for</h2><p>{item.audience}</p><h2>How it works</h2><p>{item.process}</p><h2>Frequently asked questions</h2><Questions items={item.faq?.length ? item.faq : generalFaq}/></article>
    <aside><h2>Discuss your requirements</h2><p>Tell us what you are working on and where you would like support.</p><Chat enquiry={item.title} missing/></aside></div>
    <ServiceGuide service={item}/>
    <div className="section wrap"><EnquiryForm service={item.slug}/></div>
    {related.length > 0 && <section className="section tinted"><div className="wrap"><h2>Related services</h2><ServiceCards items={related}/></div></section>}</>
}
function ServiceHero({ item, academic = false }: { item: Service; academic?: boolean }) {
  return <PhotoHero image={<EditorialImage item={item} eager/>}><div className="wrap">
    <div className="photo-hero-content">
      <span className="kicker">{academic ? item.title : 'ResearchMaker services'}</span>
      <h1>{academic ? 'Explore Learning Without Limits.' : item.title}</h1>
      <p className="lede">{academic ? 'Discover personalised tutoring across computing, medicine, law, engineering, sciences, business, humanities and more.' : item.summary}</p>
      <div className="actions">
        {academic && <a href="#tutoring-subjects" className="button">Explore Tutoring Subjects</a>}
        <a href="#service-details" className={academic ? 'button outline' : 'button'}>What this service covers</a>
        <Chat enquiry={item.title} className={academic ? 'outline' : undefined}/>
      </div>
    </div>
  </div></PhotoHero>
}

function AcademicTutoring({ item }: { item: Service }) {
  const { content } = useSite()
  return <>
    <ServiceHero item={item} academic/>
    <TutoringScrollExplorer subjects={orderedSubjects(content.tutoring)}/>
    <SubjectDirectory academic/>
    <TutoringPlanner directory/>
    <Steps tutoring/>
    <section className="section wrap tutor-study">
      <div><h2>What you can work on</h2><p className="lede">{item.description}</p></div>
      <div><h2>Who this is for</h2><p>{item.audience}</p><h2>How we work</h2><p>{item.process}</p><Questions items={item.faq?.length ? item.faq : generalFaq}/></div>
    </section>
    <ServiceGuide service={item}/>
    <div className="section wrap"><EnquiryForm service={item.slug}/></div>
    <FinalCTA/>
  </>
}

function SubjectDirectory({ academic = false }: { academic?: boolean }) {
  const { content } = useSite()
  const [term, setTerm] = useState('')
  const items = orderedSubjects(content.tutoring).filter(item => match(item.title, term) || topicsFor(content.topics, item).some(topic => match(topic.title, term)))
  return <section id="tutoring-subjects" className="section wrap">
    <h2>Explore tutoring subjects</h2>
    <label className="search"><Search size={20}/><input type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder="Search subjects and topics" aria-label="Search subjects and topics"/></label>
    {items.length ? <div className="grid subject-photo-grid">{items.map(item => {
      const topics = topicsFor(content.topics, item).filter(topic => !term.trim() || match(item.title, term) || match(topic.title, term))
      return <article className={'card subject-card' + (!term.trim() && item.slug === 'it-computer-science' ? ' subject-featured' : '')} key={item.slug}>
        <Link className="service-story" to={'/tutoring/' + item.slug}>
          <EditorialImage item={item} className="card-image" alternate={academic ? academicSubjectPhotos[item.slug] : undefined}/>
          <div className="service-copy"><h3>{item.title}</h3><p>{item.summary}</p><span className="text-link">Explore Subject <ArrowUpRight size={16} aria-hidden/></span></div>
        </Link>
        {topics.length > 0 && <details open={term.trim() ? true : undefined}>
          <summary>View topics</summary>
          <ul className="topic-list">{topics.map(topic => <li key={topic.slug}><Link to={topicPath(item.slug, topic)}>{topic.title}</Link></li>)}</ul>
        </details>}
      </article>
    })}</div> : <p className="empty" role="status">No subjects match your search.</p>}
  </section>
}

export function TutoringIndex() {
  return <><Intro kicker="Academic tutoring" title="Find support in your subject." text="Explore tutoring categories or search for a specific topic, from Python programming to academic English."><Chat enquiry="academic tutoring"/></Intro><TutoringPlanner directory/><SubjectDirectory/><Steps tutoring/><FinalCTA/></>
}
export function Blog() {
  const { content } = useSite()
  const [term, setTerm] = useState('')
  const [category, setCategory] = useState('')
  const categories = [...new Set(content.posts.map(post => post.category))]
  const posts = content.posts.filter(post => (!category || post.category === category) && match([post.title,post.summary,post.category,...post.tags].join(' '), term))
  const featured = !term && !category ? posts.filter(post => post.featured) : []
  const remaining = featured.length ? posts.filter(post => !post.featured) : posts
  return <><Intro kicker="The journal" title="Insights for independent learners." text="Read guidance on studying, research, writing and professional development."/><section className="section wrap">{featured.length > 0 && <><h2>Featured articles</h2><div className="grid three featured-posts">{featured.map(post => <PostCard key={post.slug} post={post}/>)}</div></>}
    <div className="filters"><label className="search"><Search size={20}/><input type="search" aria-label="Search articles" placeholder="Search articles" value={term} onChange={event => setTerm(event.target.value)}/></label><select aria-label="Article category" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{categories.map(name => <option key={name}>{name}</option>)}</select></div>
    {remaining.length > 0 && <div className="grid three">{remaining.map(post => <PostCard key={post.slug} post={post}/>)}</div>}{posts.length === 0 && <div className="contact-panel" role="status"><p>{content.posts.length ? "No articles match your filters." : "There are no published articles yet. Explore study topics or get guidance on a research project."}</p>{!content.posts.length && <div className="actions"><Link className="text-link" to="/tutoring">Browse tutoring topics</Link><Link className="text-link" to="/services/academic-research-support">Explore research guidance</Link></div>}</div>}</section><FinalCTA/></>
}
export function Article({post, preview = false}: {post: Post; preview?: boolean}) {
  const { content, base } = useSite()
  const related = content.posts.filter(item => item.slug !== post.slug && item.category === post.category).slice(0,3)
  const url = encodeURIComponent(base + '/blog/' + post.slug)
  const matchedTopics = content.topics.filter(topic => post.tags.some(tag => tag.toLowerCase() === topic.title.toLowerCase())).slice(0, 3)
  const readingLinks = matchedTopics.flatMap(topic => content.tutoring.filter(subject => topicsFor([topic], subject).length > 0).map(subject => <li key={topic.categoryId + topic.slug}><Link to={topicPath(subject.slug, topic)}>{topic.title}</Link></li>))
  return <><Intro kicker={preview ? 'Article preview' : post.category} title={post.title} text={post.summary}><p>{post.author}{post.publishedAt && <> · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></>}</p></Intro>
    <article className="wrap section article prose">{post.image && <img className="article-image" src={post.image} alt={post.alt ?? ''}/>}<div dangerouslySetInnerHTML={{ __html: post.body }}/>{post.tags?.length > 0 && <ul className="tags">{post.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}{!preview && <div className="actions"><a className="text-link" href={'https://wa.me/?text=' + url} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a><a className="text-link" href={'https://twitter.com/intent/tweet?url=' + url} target="_blank" rel="noopener noreferrer">Share on X</a></div>}</article>
    {!preview && <aside className="wrap"><h2>Put this into practice</h2><ul className="contact-links">{readingLinks}<li><Link to="/tutoring">Find tutoring by topic</Link></li><li><Link to="/services">Explore academic support services</Link></li></ul></aside>}
    {!preview && related.length > 0 && <section className="section tinted"><div className="wrap"><h2>Related articles</h2><div className="grid three">{related.map(item => <PostCard key={item.slug} post={item}/>)}</div></div></section>}{!preview && <FinalCTA/>}</>
}
function Reviews({ limit }: { limit?: number }) {
  const { content } = useSite()
  const [active, setActive] = useState(0)
  const items = content.testimonials.slice(0, limit)
  const item = items[active]
  if (!item) return <p className="review-note">Have a question about working with us? <Link className="text-link" to="/contact">Talk to ResearchMaker</Link></p>
  return <div className="review-carousel"><figure className="review" key={item._id}><blockquote>{item.review}</blockquote>{item.rating && <p>{item.rating} out of 5</p>}<figcaption><strong>{item.name}</strong><span>{item.service} ? {formatDate(item.date)}</span></figcaption></figure>
    {items.length > 1 && <div className="explorer-controls"><button type="button" aria-label="Previous testimonial" onClick={() => setActive((active + items.length - 1) % items.length)}><ChevronLeft size={20}/></button><span aria-live="polite">{active + 1} / {items.length}</span><button type="button" aria-label="Next testimonial" onClick={() => setActive((active + 1) % items.length)}><ChevronRight size={20}/></button></div>}</div>
}
export function Testimonials() { return <><Intro kicker="Testimonials" title="In our learners’ words."/><section className="section wrap"><Reviews/></section><FinalCTA/></> }

export function About() { return <><Intro kicker="About ResearchMaker" title="Supporting ambition through knowledge." text="ResearchMaker provides UK-focused tutoring, academic guidance and research support for learners and professionals."/><section className="section wrap split why"><img {...sitePhotos.about} loading="lazy"/><div><h2>Build skills you can use independently.</h2><p>Develop your understanding through focused explanations, guided practice and feedback on your own work. Our support spans computing, health sciences, law, engineering and a wide range of other disciplines.</p><Link className="text-link" to="/academic-integrity">Read our academic integrity policy</Link></div></section><Steps/><FinalCTA/></> }
export function Contact() {
  const { content: { settings, services } } = useSite()
  return <><Intro kicker="Contact ResearchMaker" title="Let’s talk about what you need." text="Tell us your subject or service, your level and where you would like guidance."><Chat missing showNumber label="Connect on WhatsApp"/></Intro><section className="section wrap enquiry-layout"><EnquiryForm/><div><div className="contact-panel"><h2>Choose a service</h2><ul className="contact-links">{services.slice(0,6).map(item => <li key={item.slug}><Link to={'/services/' + item.slug}>{item.title}</Link></li>)}</ul>{settings.email && <p><a href={'mailto:' + settings.email}>{settings.email}</a></p>}{settings.socials.map(url => <p key={url}><a href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname}</a></p>)}</div><div><h2>Common questions</h2><Questions items={generalFaq.slice(0,3)}/></div></div></section></>
}
export function StaticPage() {
  const { pathname } = useLocation()
  const policy = policies[pathname as keyof typeof policies]
  if (policy) return <><Intro kicker="ResearchMaker policies" title={policy.title} text="Draft for business and legal review before publication."/><article className="section wrap article prose">{policy.sections.map(([title,text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}</article></>
  return <><Intro kicker="Help and enquiries" title="Frequently asked questions."/><section className="section wrap"><Questions items={generalFaq}/></section><FinalCTA/></>
}
export function ErrorPage({unavailable = false}: {unavailable?: boolean}) { return <Intro kicker={unavailable ? 'Service unavailable' : 'Page not found'} title={unavailable ? 'Please try again shortly.' : 'This page is unavailable.'} text={unavailable ? 'The website is temporarily unable to load its content.' : 'You can return home or explore our services.'}><div className="actions"><Link className="button" to="/">Return home</Link><Link className="text-link" to="/services">Explore services</Link></div></Intro> }

