import { useId, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Chat, useSite } from './ui'
import { whatsappLink } from '../shared/whatsapp.mjs'

export function EnquiryForm({ service: fixedService }: { service?: string }) {
  const { content: { services, tutoring, settings } } = useSite()
  const [search] = useSearchParams()
  const id = useId()
  const [service, setService] = useState(() => services.find(item => item.slug === (fixedService ?? search.get('service')))?.slug ?? '')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [draftLink, setDraftLink] = useState('')
  const subjectApplicable = !service || service === 'academic-tutoring'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const read = (name: string) => String(fields.get(name) ?? '').trim()
    const payload = {
      name: read('name'), email: read('email'), phone: read('phone'), service,
      subject: subjectApplicable ? read('subject') : '', message: read('message'),
      privacy: fields.get('privacy') === 'on', website: read('website')
    }
    setReference('')
    setDraftLink('')
    setError('')
    if (payload.name.length < 2 || payload.message.length < 10 || !/^\+[1-9]\d{7,14}$/.test(payload.phone.replace(/[ ()-]/g, ''))) {
      setError('Enter your name, a WhatsApp number with its country code, and a message of at least 10 characters.')
      return
    }
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    if (submitter?.getAttribute('value') !== 'form') {
      const subject = tutoring.find(item => item.slug === payload.subject)?.title
      const message = [
        `Hello ${settings.name}, I would like to make an enquiry.`, '',
        `Name: ${payload.name}`, `Email: ${payload.email}`, `WhatsApp: ${payload.phone}`,
        `Service: ${selectedTitle ?? 'Help me choose'}`,
        ...(subject ? [`Tutoring subject: ${subject}`] : []), '', 'Message:', payload.message
      ].join('\n')
      const url = whatsappLink(settings.whatsapp, message)
      if (!url) { setError('WhatsApp is unavailable. You can send your enquiry using the website instead.'); return }
      setDraftLink(url)
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    setSending(true)
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const result = await response.json()
      if (!response.ok || typeof result.reference !== 'string') throw new Error(result.error || 'The form is temporarily unavailable. Please try again.')
      form.reset()
      setReference(result.reference)
    } catch (error) {
      setError(error instanceof TypeError ? 'Connection failed. Try again or contact us on WhatsApp.' : error instanceof Error ? error.message : 'We could not submit your enquiry.')
    } finally { setSending(false) }
  }

  const selectedTitle = services.find(item => item.slug === service)?.title
  return <section className="contact-panel enquiry-panel" id="enquiry" aria-labelledby={id + '-heading'}>
    <h2 id={id + '-heading'}>Tell us what you need</h2>
    <div className="actions"><Chat enquiry={selectedTitle} label="Enquire on WhatsApp"/><span>or send us an enquiry below.</span></div>
    <form className="enquiry-form" onSubmit={submit} onChange={() => { setReference(''); setError(''); setDraftLink('') }}>
      <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label>
      <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>
      <label>WhatsApp number<input name="phone" type="tel" autoComplete="tel" placeholder="+44 7700 900000" maxLength={30} required/></label>
      <label><span id={id + '-service'}>Service</span><select aria-labelledby={id + '-service'} name="service" value={service} onChange={event => setService(event.target.value)}><option value="">Help me choose</option>{services.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>
      {subjectApplicable && <label className="enquiry-wide"><span id={id + '-subject'}>Tutoring subject <small>(optional)</small></span><select name="subject" aria-labelledby={id + '-subject'}><option value="">Choose a subject</option>{tutoring.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label>}
      <label className="enquiry-wide">How can we help?<textarea name="message" rows={4} minLength={10} maxLength={1600} required/></label>
      <div className="enquiry-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <label className="enquiry-wide enquiry-consent"><input name="privacy" type="checkbox" required/><span>I have read the <Link to="/privacy">privacy notice</Link> and understand my details will be used to respond to my enquiry.</span></label>
      <div className="enquiry-wide actions"><button className="button" type="submit" disabled={sending}>Continue to WhatsApp</button><button className="button outline" type="submit" value="form" disabled={sending}>{sending ? 'Sending…' : 'Submit on website'}</button></div>
    </form>
    {error && <p role="alert">{error}</p>}
    {draftLink && <p role="status">Review the draft and tap Send in WhatsApp. <a className="text-link" href={draftLink} target="_blank" rel="noopener noreferrer">Open WhatsApp again</a></p>}
    {reference && <div className="enquiry-preview" role="status"><h3>Enquiry received</h3><p>Your message is saved. Keep this reference for follow-up: <strong>{reference}</strong>.</p></div>}
  </section>
}
