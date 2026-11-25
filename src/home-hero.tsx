import { useEffect, useState } from 'react'
import { ArrowUpRight, HeartPulse, Laptop, Pause, Play, Scale, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { settings as defaultSettings } from '../shared/catalog.mjs'
import { Chat, useSite } from './ui'
import './home-hero.css'

const features = [
  { slug: 'it-computer-science', label: 'Computing', title: 'IT & Computer Science', icon: Laptop, imageKey: 'heroComputingImage', image: '/images/hero/computing.webp', position: '63% 48%' },
  { slug: 'medical-health-sciences', label: 'Health sciences', title: 'Medical & Health Sciences', icon: HeartPulse, imageKey: 'heroHealthImage', image: '/images/hero/health.webp', position: '58% 51%' },
  { slug: 'law-llb', label: 'Law', title: 'Law & Legal Studies', icon: Scale, imageKey: 'heroLawImage', image: '/images/hero/law.webp', position: '64% 49%' },
  { slug: 'academic-research-support', label: 'Research', title: 'Research & Academic Support', icon: Search, imageKey: 'heroResearchImage', image: '/images/hero/research.webp', position: '58% 55%', service: true }
] as const

export function HomeHero() {
  const { content } = useSite()
  const entries = features.flatMap(feature => {
    const service = 'service' in feature
    const item = (service ? content.services : content.tutoring).find(item => item.slug === feature.slug)
    return item ? [{ ...feature, service, image: content.settings[feature.imageKey] || feature.image, summary: item.summary, href: (service ? '/services/' : '/tutoring/') + item.slug, enquiry: item.title + (service ? '' : ' tutoring') }] : []
  })
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [reduced, setReduced] = useState(false)
  const selected = entries[active] ?? entries[0]
  const rotating = entries.length > 1 && !paused && !focused && !hovered && !reduced

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setActive(index => (index + 1) % entries.length)
    }, 7500)
    return () => window.clearInterval(timer)
  }, [rotating, entries.length])

  return <section className="photo-hero photo-hero-home immersive-hero" aria-label="Featured learning areas"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="immersive-backdrop" aria-hidden="true">
      {entries.length ? entries.map((entry, index) => <img key={entry.slug} src={entry.image} alt="" data-active={selected?.slug === entry.slug}
        style={{ objectPosition: entry.position }} fetchPriority={index === 0 ? 'high' : 'low'} decoding="async"/>)
        : <img src="/images/library.jpg" alt="" data-active="true"/>}
    </div>
    <div className="wrap immersive-layout">
      <div className="immersive-copy">
        <span className="kicker">UK tutoring &amp; academic support</span>
        <h1>{content.settings.heroTitle === defaultSettings.heroTitle ? 'Learn Beyond Limits.' : content.settings.heroTitle.replace(/\n/g, ' ')}</h1>
        {selected && <div className="immersive-mask" aria-live={paused ? 'polite' : 'off'}><p key={selected.slug} className="immersive-subject">{selected.title}</p></div>}
        <p className="lede immersive-summary">{selected?.summary ?? content.settings.heroText}</p>
        <div className="actions">
          <Link className="button" to={selected?.href ?? '/tutoring'}>{selected?.service ? 'Explore Research Support' : 'Explore Tutoring'}<ArrowUpRight size={17} aria-hidden="true"/></Link>
          <Chat enquiry={selected?.enquiry} className="outline"/>
        </div>
      </div>
      {entries.length > 1 && <div className="immersive-rail" data-rotating={rotating} aria-label="Choose featured subject" role="group">
        {entries.map(({ icon: Icon, ...entry }, index) => <button type="button" key={entry.slug} aria-pressed={selected?.slug === entry.slug}
          aria-label={entry.title} onClick={() => { setActive(index); setPaused(true) }}>
          <span className="immersive-option-icon"><Icon size={20} aria-hidden="true"/><svg className="immersive-progress" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" pathLength="1"/></svg></span>
          <span>{entry.label}</span>
        </button>)}
        {!reduced && <button className="immersive-play" type="button" aria-label={paused ? 'Resume automatic rotation' : 'Pause automatic rotation'}
          onClick={() => setPaused(value => !value)}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>}
      </div>}
    </div>
  </section>
}
