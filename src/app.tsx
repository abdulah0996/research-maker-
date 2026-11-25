import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { About, Article, Blog, Contact, ErrorPage, Home, ServiceDetail, ServiceIndex, StaticPage, Testimonials, TutoringIndex } from './pages'
import { policies, defaults } from './content'
import { Chat, Footer, Header, Site } from './ui'
import { TopicDetail, TutoringDetail, topicsFor } from './tutoring-pages'
import { topicPhoto } from './topic-photography'
import { editorialPhoto } from './editorial-media'
import type { Content, Post } from './types'

const Admin = lazy(() => import('./admin'))
const publicPages: Record<string, [title: string, description: string, page: ReactNode]> = {
  '/': ['Home','',<Home/>],
  '/about': ['About ResearchMaker','Learn how ResearchMaker supports independent learning and research.',<About/>],
  '/services': ['Our Services','Explore academic tutoring, assignment guidance, proofreading and other educational services.',<ServiceIndex/>],
  '/tutoring': ['Tutoring Subjects','Find tutoring in IT, health sciences, law, engineering and other subjects.',<TutoringIndex/>],
  '/blog': ['Insights','Explore articles on study, writing, research and professional skills.',<Blog/>],
  '/testimonials': ['Testimonials','Read approved feedback on ResearchMaker services.',<Testimonials/>],
  '/contact': ['Contact','Discuss tutoring or academic guidance with ResearchMaker on WhatsApp.',<Contact/>],
  '/faq': ['Frequently Asked Questions','Find answers about enquiries, tutoring and academic integrity.',<StaticPage/>],
  ...Object.fromEntries(Object.entries(policies).map(([path, policy]) => [path, [policy.title, 'Read the ResearchMaker ' + policy.title.toLowerCase() + ' draft.', <StaticPage/>]]))
}
type Meta = { title: string; description: string; image?: string; article?: Post; service?: boolean }
type Page = { meta: Meta; view: ReactNode; status: number; admin?: boolean }
export function resolve(pathname: string, content: Content, unavailable = false): Page {
  const path = pathname.replace(/\/+$/, '') || '/'
  const brand = content.settings.name
  const result = (title: string, description: string, view: ReactNode, status = 200): Page => ({ meta: { title: title + ' | ' + brand, description }, view, status })
  if (/^\/admin(?:\/|$)/.test(path)) return { ...result('Owner Dashboard','Website content management.',<AdminRoute/>), admin: true }
  if (unavailable) return result('Service unavailable','Please try again shortly.',<ErrorPage unavailable/>,503)
  const staticPage = publicPages[path]
  if (staticPage) return path === '/' ? {
    ...result(...staticPage), meta: { title: content.settings.seoTitle, description: content.settings.seoDescription, image: '/images/library.jpg' }
  } : result(...staticPage)
  const [, section, category, topicSegment] = path.split('/')
  if (section === 'tutoring' && topicSegment) {
    const subject = content.tutoring.find(item => item.slug === category)
    const topic = subject && topicsFor(content.topics, subject).find(item => item.slug === topicSegment && path === '/tutoring/' + category + '/' + item.slug)
    if (subject && topic) return {
      status: 200,
      meta: { title: topic.metaTitle || topic.title + ' Tutoring | ' + brand, description: topic.metaDescription || topic.summary, image: topic.image || topicPhoto(subject, topic).src },
      view: <TopicDetail item={subject} topic={topic}/>
    }
  }
  const service = content.services.find(item => path === '/services/' + item.slug)
  const subject = content.tutoring.find(item => path === '/tutoring/' + item.slug)
  const post = content.posts.find(item => path === '/blog/' + item.slug)
  const item = service ?? subject ?? post
  if (item) return {
    status: 200,
    meta: { title: item.metaTitle || item.title + (subject ? ' Tutoring' : '') + ' | ' + brand, description: item.metaDescription || item.summary, image: item.image || (post ? undefined : editorialPhoto(item.slug).src), article: post, service: Boolean(service) },
    view: service ? <ServiceDetail item={service}/> : subject ? <TutoringDetail item={subject}/> : <Article post={post!}/>
  }
  return result('Page not found','Explore the ResearchMaker website.',<ErrorPage/>,404)
}
function AdminRoute() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  const fallback = <main className="admin wrap"><p>Loading owner dashboard…</p></main>
  return ready ? <Suspense fallback={fallback}><Admin/></Suspense> : fallback
}
export function App({ content = defaults, base = 'https://researchmaker.co.uk', unavailable = false }: {content?: Content; base?: string; unavailable?: boolean}) {
  const { pathname, hash } = useLocation()
  const page = resolve(pathname, content, unavailable)
  useEffect(() => {
    document.title = page.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.meta.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', base + (pathname.replace(/\/+$/, '') || '/'))
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0,0)
  }, [pathname, hash, page.meta.title, page.meta.description, base])
  return <Site.Provider value={{ content, base }}><MotionConfig reducedMotion="user">{page.admin ? page.view : <>
    <a className="skip-link" href="#main-content">Skip to content</a><Header/><main id="main-content" key={pathname.replace(/\/+$/, '')}>{page.view}</main><Footer/><Chat showNumber label="WhatsApp" className="floating-chat"/>
  </>}</MotionConfig></Site.Provider>
}
