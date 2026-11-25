import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BookOpen, Menu, X, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatWhatsAppNumber, whatsappLink } from '../shared/whatsapp.mjs'
import { defaults, links, policies } from './content'
import type { Content, FAQ, Item, Post } from './types'

export const Site = createContext({ content: defaults, base: 'https://researchmaker.co.uk' })
export const useSite = () => useContext(Site)
export function Chat({ enquiry, label = 'Enquire on WhatsApp', className = '', missing = false, showNumber = false }: { enquiry?: string; label?: string; className?: string; missing?: boolean; showNumber?: boolean }) {
  const { content: { settings } } = useSite()
  const url = whatsappLink(settings.whatsapp, settings.message, enquiry, settings.name)
  if (!url) return missing ? <p className="muted">WhatsApp enquiries are currently unavailable.</p> : null
  const number = showNumber ? formatWhatsAppNumber(settings.whatsapp) : ''
  return <a className={'button chat ' + className} href={url} target="_blank" rel="noopener noreferrer" aria-label={number ? label + ' ' + number : label}><MessageCircle size={17} aria-hidden /><span className="chat-copy"><span className="chat-label">{label}</span>{number && ' '}{number && <span className="chat-number">{number}</span>}</span></a>
}
export function Brand() {
  const { content: { settings } } = useSite()
  return <Link className="brand" to="/"><span className="brand-mark"><BookOpen size={19} strokeWidth={1.5} /></span>{settings.name}</Link>
}
export function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])
  return <header className="header"><div className="wrap nav-row"><Brand />
    <nav aria-label="Main navigation" className="desktop-nav">{links.map(([label, href]) => <NavLink key={href} to={href} end={href === '/'}>{label}</NavLink>)}</nav>
    <div className="desktop-chat"><Chat showNumber /></div>
    <Chat showNumber className="mobile-contact" />
    <button type="button" className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </div>{open && <motion.nav id="mobile-menu" aria-label="Mobile navigation" className="mobile-nav wrap" initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus() } }}>
    {links.map(([label, href]) => <NavLink key={href} to={href} onClick={() => setOpen(false)}>{label}</NavLink>)}<Chat showNumber />
  </motion.nav>}</header>
}
export function Footer() {
  const { content: { settings, tutoring, services } } = useSite()
  return <footer><div className="wrap footer-grid">
    <div><Brand /><p>{settings.footerText}</p><Chat showNumber />{settings.email && <p><a href={'mailto:' + settings.email}>{settings.email}</a></p>}</div>
    <div><h2>Explore</h2>{services.slice(0,4).map(service => <Link key={service.slug} to={'/services/' + service.slug}>{service.title}</Link>)}<Link to="/services">All services</Link></div>
    <div><h2>Tutoring</h2>{tutoring.slice(0,4).map(subject => <Link key={subject.slug} to={'/tutoring/' + subject.slug}>{subject.title}</Link>)}<Link to="/tutoring">All subjects</Link></div>
    <div><h2>Information</h2><Link to="/faq">Frequently asked questions</Link><Link to="/testimonials">Testimonials</Link>{Object.entries(policies).map(([href, data]) => <Link key={href} to={href}>{data.title}</Link>)}</div>
  </div><div className="wrap footer-bottom">© {new Date().getUTCFullYear()} {settings.name}<div>{settings.socials.map(url => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname.replace(/^www\./,'')}</a>)}</div></div></footer>
}
export function Reveal({ children, className }: {children: ReactNode; className?: string}) {
  return <motion.div className={className} initial={false} whileInView={{ y: [12, 0] }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: .45 }}>{children}</motion.div>
}
export function Intro({ kicker, title, text, children }: {kicker: string; title: string; text?: string; children?: ReactNode}) {
  return <section className="page-intro"><div className="wrap"><span className="kicker">{kicker}</span><h1>{title}</h1>{text && <p className="lede">{text}</p>}{children}</div></section>
}
export function Card({ item, path, enquiry, icon }: {item: Item; path: string; enquiry?: string; icon?: ReactNode}) {
  return <article className="card">{item.image && <img className="card-image" src={item.image} alt={item.alt ?? ''} loading="lazy" />}
    <div className="card-content">{icon && <span className="icon">{icon}</span>}<h3><Link to={path + item.slug}>{item.title}</Link></h3><p>{item.summary}</p><div className="card-actions"><Link className="text-link" to={path + item.slug}>Explore</Link>{enquiry && <Chat enquiry={enquiry} label="Enquire on WhatsApp" className="compact-chat" />}</div></div></article>
}
export const formatDate = (date: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date))
export function PostCard({post}: {post: Post}) {
  return <article className="card post-card">{post.image && <img className="card-image" src={post.image} alt={post.alt || ''} loading="lazy"/>}<div className="card-content"><span className="kicker">{post.category}</span><h3><Link to={'/blog/' + post.slug}>{post.title}</Link></h3><p>{post.summary}</p>{post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}<Link className="text-link" to={'/blog/' + post.slug}>Read more</Link></div></article>
}
export function Questions({ items }: { items: FAQ[] }) {
  return <div className="questions">{items.map(({q,a}, index) => <details key={q + index}><summary>{q}</summary><p>{a}</p></details>)}</div>
}
export function FinalCTA() {
  return <section className="final cinematic-final"><div className="wrap"><h2>Your next step starts with the right guidance.</h2><div className="actions"><Chat label="Connect on WhatsApp" className="light" /><Link to="/contact#enquiry" className="button light">Use the enquiry form</Link></div></div></section>
}
