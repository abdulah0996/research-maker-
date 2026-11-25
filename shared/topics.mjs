import { tutoring } from './catalog.mjs'
import { notes } from './curriculum.mjs'
import { moreNotes } from './curriculum-more.mjs'
import { topicOverviews } from './topic-overviews.mjs'

import { categoryKey, topicSlug } from './topic-routes.mjs'

const curriculum = new Map(tutoring.flatMap((subject, index) => {
  const rows = [...notes, ...moreNotes][index].split('\n')
  if (rows.length !== subject.topics.length) throw new Error('Curriculum count mismatch for ' + subject.slug)
  return subject.topics.map((title, position) => [title, rows[position].split('|')])
}))

const details = {
  'Film Studies': {
    related: ['media-studies', 'digital-media', 'art-history'],
    description: 'Film Studies examines how moving images create meaning. A scene can tell us what a character knows through framing or a cut, while sound may suggest something that never appears on screen. Studying these choices alongside genre, history and cultural context helps you build an interpretation that you can support with evidence.',
    areas: ['Film language and visual storytelling: connect what viewers see and hear to how they interpret a scene.', 'Cinematography and composition: compare framing, lighting, camera movement and the placement of performers.', 'Film narrative and genre: trace how stories distribute information and how genres set up or subvert expectations.', 'Film theory and criticism: use a theoretical lens to test an interpretation against a sequence.', 'Editing and sound: examine pacing, continuity, transitions and the relationship between on-screen and off-screen sound.', 'Film history and cultural context: place stylistic choices within a period, industry or audience context.', 'Critical analysis: use precise observations and timecodes to support claims about form and meaning.', 'Research and essay planning: turn scene notes and critical sources into a structured argument.'],
    faq: [
      {q:'Can we analyse a film from my module?',a:'Share the title, scene or timecodes and module brief. We can use a short sequence to practise forming an interpretation you can defend with evidence.'},
      {q:'How do I move beyond summarising the plot?',a:'Choose a detail such as a cut or change in sound. Explain how it changes what the viewer knows or expects, and connect that observation to your argument.'},
      {q:'Can we compare films from different periods?',a:'Yes. A useful starting point is a shared question about genre, point of view or style. We can then compare specific scenes and discuss relevant historical context.'},
      {q:'Can I bring an essay plan?',a:'Yes. Bring your working question, outline or sample paragraph. We can review how your argument connects film evidence and critical sources.'}
    ]
  }
}

export function makeTopics(subject) {
  const used = new Set()
  return [...new Set(subject.topics)].map((title, order) => {
    const baseSlug = topicSlug(title) || 'topic'
    let slug = baseSlug.slice(0, 88).replace(/-$/, '')
    for (let suffix = 2; used.has(slug); suffix++) slug = baseSlug.slice(0, 88).replace(/-$/, '') + '-' + suffix
    used.add(slug)
    const [first, second, task] = curriculum.get(title) ?? [
      'the concepts in your module outline', 'ways to apply and evaluate those concepts', 'work through a practice example from your module'
    ]
    return {
      categoryId: categoryKey(subject), title, slug, order, published: true,
      summary: 'Explore ' + first + ', with guided practice in ' + second + '.',
      description: topicOverviews[title] ?? (title + ' tutoring starts with ' + first + ' and connects that foundation to ' + second + '. A session can use a worked example to review your reasoning and help you explain how you reached an answer.'),
      areas: ['Explain ' + first + ' using a worked example.', 'Compare approaches to ' + second + ' and explain when each fits.', 'Review the assumptions and evidence behind your ' + title + ' work.'],
      skills: ['Explain ' + first + ' in your own words.', 'Apply ' + second + ' to a new example and check your reasoning.'],
      activities: ['Together, ' + task + '. Discuss your choices, then try a related example independently.'],
      audience: 'Learners studying ' + title + ' or revisiting it independently. Share your current level and any course requirements so ResearchMaker can confirm whether the support fits.',
      faq: [
        { q: 'What could we cover first in ' + title + '?', a: 'A starting point is ' + first + '. Share a question or module outline so we can decide which concepts to prioritise.' },
        { q: 'What would a practical ' + title + ' exercise look like?', a: 'One option is to ' + task + '. We can use your working to discuss what you understood and what to practise next.' },
        { q: 'Can we focus on ' + second + '?', a: 'Yes. Bring a short example or a point where you get stuck. That gives us a way to compare approaches and discuss your reasoning.' },
        { q: 'Can I bring coursework or module materials?', a: 'Yes. Bring the brief and your own notes or draft. Tutoring can help you interpret the task, plan your approach and review your work.' }
      ],
      ...details[title]
    }
  })
}
export const defaultTopics = tutoring.flatMap(makeTopics)
