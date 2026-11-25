import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EditorialImage } from './editorial-media'
import { Chat } from './ui'
import type { Subject } from './types'

const desktopQuery = '(min-width: 960px) and (min-height: 670px) and (prefers-reduced-motion: no-preference)'
const step = 175

export function TutoringScrollExplorer({ subjects }: { subjects: Subject[] }) {
  const stage = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const count = subjects.length
  const current = subjects[Math.min(active, count - 1)]
  const increment = 360 / Math.max(1, count)

  useEffect(() => {
    const query = matchMedia(desktopQuery)
    let frame = 0
    const update = () => {
      frame = 0
      if (!query.matches || !section.current || !stage.current) return
      const top = Number.parseFloat(getComputedStyle(stage.current).top)
      const distance = Math.max(0, top - section.current.getBoundingClientRect().top)
      const progress = Math.min(count - 1, distance / step)
      ring.current?.style.setProperty('--turn', -progress * increment + 'deg')
      setActive(Math.round(progress))
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    query.addEventListener('change', queue)
    queue()
    return () => {
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      query.removeEventListener('change', queue)
      cancelAnimationFrame(frame)
    }
  }, [count, increment])

  function select(index: number) {
    const next = Math.max(0, Math.min(count - 1, index))
    setActive(next)
    if (matchMedia(desktopQuery).matches && section.current && stage.current) {
      const top = Number.parseFloat(getComputedStyle(stage.current).top)
      window.scrollTo({ top: window.scrollY + section.current.getBoundingClientRect().top - top + next * step, behavior: 'instant' })
    }
  }

  if (!current) return null
  return <section id="featured-tutoring" className="subject-explorer" ref={section}
    style={{ '--journey-distance': (count - 1) * step + 'px' } as CSSProperties}>
    <div className="explorer-stage" ref={stage}>
      <div className="wrap explorer-layout">
        <div className="explorer-visual"
          onPointerDown={event => { if (event.pointerType === 'touch') gesture.current = { x: event.clientX, y: event.clientY } }}
          onPointerCancel={() => { gesture.current = null }}
          onPointerUp={event => {
            const start = gesture.current
            gesture.current = null
            if (!start || matchMedia(desktopQuery).matches) return
            const dx = event.clientX - start.x
            if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.5) select(active + (dx < 0 ? 1 : -1))
          }}>
          <div className="explorer-photos">{subjects.map(subject =>
            <div className={subject.slug === current.slug ? 'explorer-photo current' : 'explorer-photo'} key={subject.slug} aria-hidden={subject.slug !== current.slug}>
              <EditorialImage item={subject}/>
            </div>)}</div>
          <div className="explorer-ring" ref={ring} role="group" aria-label="Select tutoring subject"
            onKeyDown={event => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              const next = Math.max(0, Math.min(count - 1, event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : active + (event.key === 'ArrowLeft' ? -1 : 1)))
              select(next)
              ring.current?.querySelectorAll('button')[next]?.focus({ preventScroll: true })
            }}>
            {subjects.map((subject, index) => {
              const angle = index * increment * Math.PI / 180
              return <button key={subject.slug} type="button" aria-label={subject.title} title={subject.title}
                aria-pressed={subject.slug === current.slug} tabIndex={subject.slug === current.slug ? 0 : -1}
                style={{ left: (50 + Math.sin(angle) * 50).toFixed(5) + '%', top: (50 - Math.cos(angle) * 50).toFixed(5) + '%' }}
                onClick={() => select(index)}><span/></button>
            })}
          </div>
        </div>
        <div className="explorer-content">
          <div className="explorer-label"><span className="kicker">Tutoring subjects</span><Link className="text-link" to="/tutoring">View all subjects</Link></div>
          <div className="explorer-progress">
            <span>{String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
            <progress aria-label="Subject progress" max={count} value={active + 1}/>
          </div>
          <div className="explorer-story">
            <AnimatePresence initial={false}>
              <motion.div key={current.slug} initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : .26 }} className="explorer-caption">
                <h2>{current.title}</h2><p>{current.summary}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="explorer-controls">
            <button type="button" aria-label="Previous subject" onClick={() => select(active - 1)} disabled={active === 0}><ChevronLeft size={20}/></button>
            <select aria-label="Tutoring subject" value={active} onChange={event => select(Number(event.target.value))}>
              {subjects.map((subject, index) => <option value={index} key={subject.slug}>{subject.title}</option>)}
            </select>
            <button type="button" aria-label="Next subject" onClick={() => select(active + 1)} disabled={active === count - 1}><ChevronRight size={20}/></button>
          </div>
          <div className="actions"><Link className="button" to={'/tutoring/' + current.slug}>Explore subject</Link><Chat className="outline" enquiry={current.title + ' tutoring'}/></div>
        </div>
      </div>
    </div>
  </section>
}
