import { services, tutoring, settings } from '../shared/catalog.mjs'
import type { Content, FAQ } from './types'

export const defaults: Content = { services, tutoring, topics: [], settings, posts: [], testimonials: [] }
export const links = [['Home','/'],['About','/about'],['Services','/services'],['Tutoring','/tutoring'],['Blog','/blog'],['Contact','/contact']]
export const policies = {
  '/privacy': { title: 'Privacy Policy', sections: [
    ['Information you choose to share', 'When you submit the contact form, ResearchMaker stores your name, email, WhatsApp number, selected service or subject, and message. Direct WhatsApp enquiries contain the information you choose to send. Share only what is needed to discuss your enquiry.'],
    ['How information is used', 'Enquiry information is used to respond, understand your requirements and arrange support if you decide to go ahead. WhatsApp processes messages under its own terms and privacy information.'],
    ['Your information rights', 'Depending on the circumstances, you may have rights to access or correct personal information, request erasure, or object to certain processing. You can raise concerns with the Information Commissioner’s Office.'],
    ['Details for business review', 'Confirm the controller’s identity and contact details, purposes and lawful bases, retention periods, service providers, international transfers and how people can exercise their rights before approval.']
  ] },
  '/terms': { title: 'Terms & Conditions', sections: [
    ['Scope of support', 'Tutoring and academic guidance focus on developing the learner’s own understanding and work. The scope, format, charges and timing of a service should be agreed before it begins.'],
    ['Changes and concerns', 'Contact ResearchMaker to discuss any proposed change to the agreed support or to raise a concern.'],
    ['Details for business review', 'Confirm the contracting entity, service and payment terms, cancellation and refund procedures, consumer rights and complaints process before approval.']
  ] },
  '/cookies': { title: 'Cookie Policy', sections: [
    ['Owner sign-in', 'The website uses an essential session cookie for authenticated website owners. It expires after eight hours and is cleared at sign-out.'],
    ['External services', 'Following a WhatsApp or social link takes you to another service, which applies its own cookie and privacy practices.'],
    ['Details for business review', 'Check the production hosting and any added integrations for further storage or tracking before approving this policy.']
  ] },
  '/academic-integrity': { title: 'Academic Integrity Policy', sections: [
    ['Independent work', 'You are responsible for the work you submit. ResearchMaker can explain concepts, help you plan and offer feedback to guide your own revisions.'],
    ['Boundaries', 'ResearchMaker does not complete assessed work, sit exams, impersonate learners, fabricate evidence or supply text intended to be submitted as a learner’s own.'],
    ['Institutional rules', 'Check your institution’s rules on external tutoring, editing and disclosure before sharing any materials or using feedback.']
  ] }
}
export const generalFaq: FAQ[] = [
  { q: 'How do I enquire about support?', a: 'Choose a service or tutoring subject and use its WhatsApp link. Tell us what you are working on, your level and the sort of guidance you are looking for.' },
  { q: 'Can I ask about one specific topic?', a: 'Yes. Mention the topic and what you have already tried so we can discuss the most relevant support.' },
  { q: 'Can you complete assessed work for me?', a: 'Our support focuses on explanations, planning and feedback so you can develop and submit your own work.' },
  { q: 'How are fees and availability agreed?', a: 'Discuss your requirements on WhatsApp. The team can confirm the scope, availability and fees before you decide whether to proceed.' }
]
export const subjectFaq = (subject: string): FAQ[] => [
  { q: 'How do I enquire about ' + subject + '?', a: 'Choose a topic below and open WhatsApp. Include your level, the topic you want to cover and any particular questions.' },
  { q: 'Can tutoring focus on a specific module?', a: 'Yes. Share the module and describe the concepts or skills you want to practise.' }
]
