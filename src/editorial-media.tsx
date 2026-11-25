import { useState } from 'react'
import type { Item } from './types'

const captions: Record<string, string> = {
  architecture: 'Glass office buildings viewed from street level',
  building: 'An angular modern building with intersecting planes',
  charts: 'A plotted graph and measuring tools on a desk',
  code: 'Source code open on a monitor',
  education: 'School books, an apple and alphabet blocks on a desk',
  maps: 'A detailed world map',
  team: 'Colleagues collaborating around a desk',
  technical: 'A person drafting technical drawings by hand',
  workspace: 'A laptop and notebooks on a workspace',
  'film-studies': 'A clapperboard on an outdoor film set',
  journalism: 'A reader holding an open newspaper',
  'graphic-design-theory': 'Graphic design tools on a desk',
  'topic-medicine': 'Hospital equipment inside an operating theatre',
  'topic-anatomy': 'An anatomical model of the human heart',
  'topic-pathology': 'Technicians and equipment in a laboratory',
  'topic-pharmacology': 'An assortment of tablets and capsules',
  'topic-nursing': 'One person holding another person?s hand',
  'topic-dentistry': 'A dentist examining dental scans',
  "academic-tutoring": "Students learning together around a table",
  "assignment-guidance-and-academic-support": "Colleagues reviewing work on a laptop",
  "proofreading-and-editing": "Fountain pen marking handwritten text",
  "academic-research-support": "Glass laboratory flasks arranged on a worktop",
  "dissertation-and-thesis-guidance": "A student drafting notes at a desk",
  "research-proposal-guidance": "A group planning around an open document",
  "literature-review-support": "Library shelves filled with research material",
  "referencing-and-citation-assistance": "A hand holding a stack of reference books",
  "academic-writing-coaching": "Notebook and writing materials",
  "data-analysis-and-statistical-support": "Data visualisations on a screen",
  "it-project-mentoring-and-code-review": "Software source code on a monitor",
  "legal-research-support": "Statue of Lady Justice holding scales",
  "educational-content-and-blogging-services": "A workspace for planning and writing",
  "it-computer-science": "Source code displayed on a computer screen",
  "medical-health-sciences": "Medical professional holding a phone and wearing a stethoscope",
  "law-llb": "Classical busts beside law library shelves",
  "engineering": "Engineer reviewing code at a workstation",
  "mathematics-statistics": "Mathematical equations and notation",
  "physical-natural-sciences": "Pipette above a laboratory assay plate",
  "business-management": "Business team discussing work",
  "accounting-finance-economics": "Financial performance charts on a laptop",
  "humanities-social-sciences": "A person observing a wide landscape",
  "english-literature-languages": "A stack of novels and literary works",
  "arts-media-design": "Visual art materials and paints",
  "school-college-subjects": "Students in a classroom",
  "test-exam-preparation": "Student concentrating on coursework in a classroom",
  "research-methods-data-analysis": "Data-themed display inside a research workspace",
  "professional-career-skills": "Colleagues collaborating in a meeting"
}

export function editorialPhoto(slug: string) {
  const caption = captions[slug]
  return caption
    ? { src: '/images/editorial/' + slug + '.webp', alt: caption }
    : { src: '/images/library.jpg', alt: 'A curved aisle of library bookshelves' }
}

export function EditorialImage({ item, className, eager, alternate }: { item: Item; className?: string; eager?: boolean; alternate?: { src: string; alt: string } }) {
  const [failed, setFailed] = useState('')
  const { src: fallback, alt: caption } = alternate ?? editorialPhoto(item.slug)
  const preferred = item.image || fallback
  const source = preferred !== failed ? preferred : preferred === fallback ? "/images/library.jpg" : fallback
  return <img className={className} src={source} alt={source === item.image ? item.alt || item.title : caption} draggable={false}
    loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => {
      if (source === preferred) setFailed(source)
    }}/>
}
