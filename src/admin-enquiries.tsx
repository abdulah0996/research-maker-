import { useEffect, useState } from 'react'
import { api } from './api'
import type { Content } from './types'

const statuses = ['New', 'Contacted', 'In Progress', 'Closed'] as const
type Status = typeof statuses[number]
type Enquiry = { _id: string; name: string; email: string; phone: string; service: string; subject: string; message: string; status: Status; createdAt: string }
type Inbox = { items: Enquiry[]; more: boolean }

export function AdminEnquiries({ content }: { content: Content }) {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<Inbox | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let current = true
    setData(null)
    setError('')
    const query = new URLSearchParams({ page: String(page) })
    if (status) query.set('status', status)
    api<Inbox>('/enquiries?' + query).then(result => { if (current) setData(result) })
      .catch(error => { if (current) setError(error.message) })
    return () => { current = false }
  }, [status, page, revision])

  async function update(id: string, next: string) {
    setSaving(true)
    setError('')
    try {
      await api('/enquiries/' + id, 'PATCH', { status: next })
      if (status && data?.items.length === 1 && page > 1) setPage(page - 1)
      else setRevision(value => value + 1)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update status.')
    } finally { setSaving(false) }
  }

  return <section className="admin-form">
    <h2>Contact enquiries</h2>
    <label>Filter by status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}>
      <option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}
    </select></label>
    {error && <p role="alert">{error} <button className="button outline" onClick={() => setRevision(value => value + 1)}>Retry</button></p>}
    {!data && !error && <p role="status">Loading enquiries…</p>}
    {data && (data.items.length ? <ul className="guidance-results">{data.items.map(item => <li key={item._id}>
      <details className="admin-enquiry-row">
        <summary>{item.name} · {item.status} · <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('en-GB')}</time></summary>
        <p><a href={'mailto:' + item.email}>{item.email}</a> · <a href={'https://wa.me/' + item.phone.slice(1)} target="_blank" rel="noopener noreferrer">{item.phone}</a></p>
        <p>{content.services.find(service => service.slug === item.service)?.title ?? (item.service || 'General enquiry')}{item.subject && ' · ' + (content.tutoring.find(subject => subject.slug === item.subject)?.title ?? item.subject)}</p>
        <p className="enquiry-message">{item.message}</p>
        <label>Update enquiry status<select disabled={saving} value={item.status} onChange={event => void update(item._id, event.target.value)}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
      </details>
    </li>)}</ul> : <p>No enquiries match this status.</p>)}
    {data && (page > 1 || data.more) && <div className="actions">
      <button className="button outline" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button>
      <span>Page {page}</span>
      <button className="button outline" disabled={!data.more} onClick={() => setPage(value => value + 1)}>Next</button>
    </div>}
  </section>
}
