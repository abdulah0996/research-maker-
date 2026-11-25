import { useState } from 'react'
import { ArrowUpRight, BookOpen, ClipboardCheck, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { serviceAreas } from './service-areas'
import { serviceDetails, serviceGuides } from './service-guide'
import { useSite } from './ui'
import type { Service } from './types'
import './guidance-tools.css'

const goals = [
  { label: 'Understand a subject', icon: BookOpen, slugs: ['academic-tutoring', 'it-project-mentoring-and-code-review'], intro: 'Work through a concept, example or piece of code with guidance you can apply independently.' },
  { label: 'Plan research', icon: ClipboardCheck, slugs: ['academic-research-support', 'research-proposal-guidance', 'literature-review-support', 'data-analysis-and-statistical-support', 'dissertation-and-thesis-guidance', 'legal-research-support'], intro: 'Get help narrowing a question, choosing a method or understanding what your evidence supports.' },
  { label: 'Improve my writing', icon: MessageCircle, slugs: ['assignment-guidance-and-academic-support', 'academic-writing-coaching', 'proofreading-and-editing', 'referencing-and-citation-assistance', 'educational-content-and-blogging-services'], intro: 'Clarify a brief, strengthen your own draft or make your sources easier to check.' }
]

export function SupportFinder() {
  const { content } = useSite()
  const [active, setActive] = useState(0)
  const goal = goals[active]
  const options = goal.slugs.flatMap(slug => content.services.filter(service => service.slug === slug))
  return <section className="section guidance-band" id="support-finder"><div className="wrap guidance-layout">
    <div><span className="kicker">Find your starting point</span><h2>What would you like help with?</h2>
      <p className="lede">Choose a goal to see which services fit and open the one you want to explore.</p>
      <div className="guidance-options" role="group" aria-label="Support goal">{goals.map(({ label, icon: Icon }, index) => <button type="button" key={label} aria-pressed={active === index} onClick={() => setActive(index)}><Icon size={20} aria-hidden="true"/>{label}</button>)}</div>
    </div>
    <div className="guidance-panel">
      <p aria-live="polite">{goal.intro}</p>
      {options.length > 0 ? <ul className="guidance-results">{options.map(service => <li key={service.slug}><Link to={'/services/' + service.slug}><span><strong>{service.title}</strong><span>{service.summary}</span></span><ArrowUpRight size={18} aria-hidden="true"/></Link></li>)}</ul>
        : <Link className="text-link" to="/services">Browse current services</Link>}
    </div>
  </div></section>
}

export function ServiceGuide({ service }: { service: Service }) {
  const defaults = serviceGuides[service.slug]
  const details = serviceDetails[service.slug]
  const guide = {
    example: service.guideExample || defaults?.example,
    bring: service.guideBring || defaults?.bring,
    outcome: service.guideOutcome || defaults?.outcome,
    boundary: service.guideBoundary || defaults?.boundary
  }
  const cards = [['What to bring', guide.bring], ['What you can take away', guide.outcome], ['Scope of support', guide.boundary]].filter(([, value]) => value)
  return <section className="section guidance-band" id="service-details"><div className="wrap">
    <div className="guidance-heading"><span className="kicker">What this looks like in practice</span><h2>From your question to a next step</h2>{guide.example && <p className="lede">{guide.example}</p>}</div>
    <h3>What this service includes</h3><dl className="guidance-cards">{service.areas.map((area, index) => <div key={area}><dt>{area}</dt>{(service.areaDetails?.[index] || serviceAreas[service.slug]?.[index]) && <dd>{service.areaDetails?.[index] || serviceAreas[service.slug]?.[index]}</dd>}</div>)}</dl>
    {details && <div className="service-examples"><h3>Examples of how we can help</h3><dl className="guidance-cards">{details.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl></div>}
    {cards.length > 0 && <dl className="guidance-cards">{cards.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
    <Link className="button outline" to={'/contact?service=' + encodeURIComponent(service.slug) + '#enquiry'}>Ask about this service</Link>
  </div></section>
}

const stages = [
  { title: 'School or college', focus: 'Build confidence with methods and exam questions.', activity: 'Bring a syllabus topic and a question you attempted. Compare your working with the steps a marker would expect, then try a similar question.', bring: 'Your subject, year or qualification, exam board if you know it, and the question you want to revisit.' },
  { title: 'University', focus: 'Connect theory with your module and independent work.', activity: 'Pick a lecture concept you can recognise but find hard to apply. Work through a comparable example, explain your reasoning and identify what to practise next.', bring: 'Your module, current level, any course restrictions, and a lecture example or your own attempt.' },
  { title: 'Independent learning', focus: 'Build a practical skill around a goal you can describe.', activity: 'Start with a small task you want to be able to do, such as analysing a spreadsheet. Break it into steps and try one with guidance before working through a new example.', bring: 'What you want to do, what you already know, and an example of the kind of task you want to tackle.' }
]

export function TutoringPlanner({ directory = false }: { directory?: boolean }) {
  const [active, setActive] = useState(0)
  const stage = stages[active]
  return <section className="section guidance-band" id="tutoring-plan"><div className="wrap guidance-layout">
    <div><span className="kicker">Tutoring in practice</span><h2>What could your first session cover?</h2>
      <p className="lede">Choose your level to see an example and what to bring.</p>
      <div className="guidance-options" role="group" aria-label="Learner level">{stages.map(({ title }, index) => <button type="button" key={title} aria-pressed={active === index} onClick={() => setActive(index)}>{title}</button>)}</div>
    </div>
    <div className="guidance-panel tutoring-plan-result">
      <div aria-live="polite"><h3>{stage.focus}</h3><p>{stage.activity}</p><h4>What to bring</h4><p>{stage.bring}</p></div>
      <div className="actions">{directory ? <a className="text-link" href="#tutoring-subjects">Explore tutoring subjects</a> : <Link className="text-link" to="/tutoring">Explore tutoring subjects</Link>}
        <Link className="text-link" to="/contact?service=academic-tutoring#enquiry">Discuss your tutoring goals</Link>
      </div>
    </div>
  </div></section>
}
