import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { categories } from '../shared/catalog.mjs'
import { AdminEnquiries } from './admin-enquiries'
import { api, ApiError } from './api'
import { Article } from './pages'
import { TopicDetail } from './tutoring-pages'
import type { Content, Post, Topic } from './types'

type Module = 'posts' | 'services' | 'tutoring' | 'topics' | 'testimonials' | 'settings'
type Field = [name: string, label: string, type?: string]
type Form = Record<string, string | boolean>
const modules: Record<Module, string> = { posts: 'Articles', services: 'Services', tutoring: 'Tutoring', topics: 'Tutoring topics', testimonials: 'Testimonials', settings: 'Website settings' }
const base: Field[] = [
  ['title','Title'],['slug','URL slug'],['summary','Short description','copy'],['image','Featured image','image'],
  ['alt','Image alternative text','optional'],['metaTitle','SEO title','optional'],['metaDescription','SEO description','optional']
]
const visibility: Field[] = [['order','Display order','number'],['faq','Frequently asked questions','faq'],['published','Published','flag']]
const fields: Record<Module, Field[]> = {
  posts: [...base,['author','Author'],['category','Category','category'],['tags','Tags, one per line','list'],['body','Article content','rich'],['featured','Featured article','flag'],['published','Published','flag']],
  services: [...base,['description','Detailed description','copy'],['areas','Key areas, one per line','list'],['areaDetails','Area descriptions, in matching order','list'],['guideExample','Practical example','optional'],['guideBring','What to bring','optional'],['guideOutcome','What visitors can take away','optional'],['guideBoundary','Scope of support','optional'],['audience','Who it is for','copy'],['process','How it works','copy'],...visibility],
  tutoring: [...base,['topics','Legacy topic names (new entries create topic records)','list'],...visibility],
  topics: [...base,['categoryId','Tutoring category','parent'],['description','Detailed description','copy'],['cardImage','Card image','image'],['cardAlt','Card image alternative text','optional'],['areas','Learning areas, one per line','list'],['skills','Skills, one per line','list'],['activities','Practice activities, one per line','list'],['audience','Intended learners','copy'],['related','Related topic slugs, one per line','list'],['learningNotes','Learning notes, one per line','list'],...visibility],
  testimonials: [['name','Customer name'],['review','Review','copy'],['service','Service'],['rating','Rating from 1 to 5','rating'],['date','Date','date'],['approved','Approved for display','flag']],
  settings: [['name','Business name'],['email','Contact email','email'],['whatsapp','WhatsApp number in international format','optional'],['message','Default WhatsApp message','copy'],['heroTitle','Homepage headline','copy'],['heroText','Homepage introduction','copy'],['heroComputingImage','Homepage computing photograph','image'],['heroHealthImage','Homepage health sciences photograph','image'],['heroLawImage','Homepage law photograph','image'],['heroResearchImage','Homepage research photograph','image'],['introText','About section text','copy'],['footerText','Footer text','copy'],['seoTitle','Homepage SEO title'],['seoDescription','Homepage SEO description'],['socials','Social URLs, one per line','list']]
}
function formData(module: Module, record?: object): Form {
  const source = (record ?? {}) as Record<string, unknown>
  return Object.fromEntries(fields[module].map(([key,_label,type]) => {
    const value = source[key]
    if (type === 'flag') return [key, Boolean(value)]
    if (type === 'faq') return [key, Array.isArray(value) ? value.map(item => item.q + ' | ' + item.a).join('\n') : '']
    if (type === 'list') return [key, Array.isArray(value) ? value.join('\n') : '']
    return [key, String(value ?? (type === 'category' ? categories[0] : type === 'number' ? 0 : type === 'date' ? new Date().toISOString().slice(0,10) : ''))]
  }))
}
function payload(module: Module, form: Form) {
  return Object.fromEntries(fields[module].map(([key,_label,type]) => {
    const value = form[key]
    if (type === 'flag') return [key, value]
    const input = String(value)
    if (type === 'list') return [key, input.split('\n').map(line => line.trim()).filter(Boolean)]
    if (type === 'faq') return [key, input.split('\n').filter(Boolean).map(line => { const [q, ...parts] = line.split('|'); return { q, a: parts.join('|').trim() } })]
    if (type === 'number' || type === 'rating') return [key, input === '' && type === 'rating' ? null : Number(input)]
    return [key, input]
  }))
}
function RichEditor({ value, change }: { value: string; change: (html: string) => void }) {
  const editor = useEditor({ extensions: [StarterKit], content: value, immediatelyRender: false, onUpdate: ({editor}) => change(editor.getHTML()), editorProps: { attributes: { 'aria-label': 'Article content', role: 'textbox', 'aria-multiline': 'true' } } })
  const active = useEditorState({ editor, selector: ({editor}) => ({
    bold: editor?.isActive('bold'), italic: editor?.isActive('italic'), heading: editor?.isActive('heading', { level: 2 }),
    bulletList: editor?.isActive('bulletList'), orderedList: editor?.isActive('orderedList')
  }) })
  if (!editor) return null
  return <div className="editor"><div className="editor-toolbar" aria-label="Formatting">
    <button type="button" aria-pressed={active?.bold} onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
    <button type="button" aria-pressed={active?.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
    <button type="button" aria-pressed={active?.heading} onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}>Heading</button>
    <button type="button" aria-pressed={active?.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet list</button>
    <button type="button" aria-pressed={active?.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered list</button>
  </div><EditorContent editor={editor}/></div>
}
export default function Admin() {
  const [data, setData] = useState<Content | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [module, setModule] = useState<Module | 'overview' | 'enquiries'>('overview')
  const [selection, setSelection] = useState<string | null>(null)
  const [form, setForm] = useState<Form>({})
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Post | Topic | null>(null)
  const [confirm, setConfirm] = useState(false)

  async function refresh() { setData(await api<Content>('/content')) }
  function failure(error: unknown) {
    if (error instanceof ApiError && error.status === 401) { setAuthenticated(false); setData(null) }
    setError(error instanceof Error ? error.message : 'Something went wrong.')
  }
  useEffect(() => {
    api('/session').then(() => { setAuthenticated(true); return refresh() }).catch(error => {
      if (!(error instanceof ApiError && error.status === 401)) failure(error)
    }).finally(() => setLoading(false))
  }, [])
  async function task(run: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('')
    try { await run() } catch (error) { failure(error) } finally { setBusy(false) }
  }
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const credentials = Object.fromEntries(new FormData(event.currentTarget))
    void task(async () => { await api('/login', 'POST', credentials); setAuthenticated(true); await refresh() })
  }
  function select(next: Module | 'overview', id: string | null = null, record?: object) {
    setModule(next); setSelection(id); setPreview(null); setConfirm(false); setError(''); setNotice('')
    if (next !== 'overview') setForm(formData(next, record))
  }
  const set = (key: string, value: string | boolean) => {
    setForm(current => {
      const next = { ...current, [key]: value }
      if (key === 'title' && selection === 'new' && (!current.slug || current.slug === slugify(String(current.title)))) next.slug = slugify(String(value))
      return next
    })
  }
  const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (loading) return <main className="admin wrap"><p role="status">Loading owner dashboard…</p></main>
  if (!authenticated) return <main className="admin login wrap"><Link to="/">ResearchMaker website</Link><h1>Owner sign-in</h1><form onSubmit={signIn}><label>Email<input type="email" name="email" autoComplete="username" required/></label><label>Password<input type="password" name="password" autoComplete="current-password" required/></label><button className="button" disabled={busy}>Sign in</button></form>{error && <p role="alert">{error}</p>}</main>
  if (!data) return <main className="admin wrap"><h1>Owner dashboard</h1><p role="alert">{error || 'Loading content…'}</p><button className="button" disabled={busy} onClick={() => void task(refresh)}>Retry</button></main>

  const active = module !== 'overview' && module !== 'enquiries' && (module === 'settings' || selection !== null)
  const currentModule = module === 'overview' || module === 'enquiries' ? null : module
  const records = currentModule && currentModule !== 'settings' ? data[currentModule] : []
  function save(event: FormEvent) {
    event.preventDefault()
    if (!currentModule) return
    void task(async () => {
      const endpoint = '/' + currentModule + (selection && selection !== 'new' ? '/' + selection : '')
      const result = await api<{ _id: string }>(endpoint, selection === 'new' ? 'POST' : 'PUT', payload(currentModule, form))
      await refresh()
      if (selection === 'new') setSelection(result._id)
      setNotice('Changes saved.')
    })
  }
  return <main className="admin wrap"><header className="admin-top"><div><Link to="/">View website</Link><h1>Owner dashboard</h1></div><button className="button outline" disabled={busy} onClick={() => void task(async () => { await api('/logout', 'POST'); setAuthenticated(false); setData(null); select('overview') })}>Sign out</button></header>
    <nav aria-label="Dashboard sections" className="admin-nav"><button aria-pressed={module === 'overview'} disabled={busy} onClick={() => select('overview')}>Overview</button>{Object.entries(modules).map(([key,label]) => <button key={key} disabled={busy} aria-pressed={module === key} onClick={() => select(key as Module, null, key === 'settings' ? data.settings : undefined)}>{label}</button>)}<button aria-pressed={module === 'enquiries'} onClick={() => { select('overview'); setModule('enquiries') }}>Contact enquiries</button></nav>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {module === 'enquiries' && <AdminEnquiries content={data}/>}
    {module === 'overview' && <div className="grid three">{[
      ['Published articles', data.posts.filter(item => item.published).length], ['Draft articles', data.posts.filter(item => !item.published).length],
      ['Services', data.services.length], ['Tutoring categories', data.tutoring.length], ['Approved testimonials', data.testimonials.filter(item => item.approved).length]
    ].map(([label,count]) => <div className="admin-stat" key={label}><strong>{count}</strong><span>{label}</span></div>)}</div>}
    {currentModule && currentModule !== 'settings' && <section className="admin-list"><div className="section-head"><h2>{modules[currentModule]}</h2><button className="button" disabled={busy} onClick={() => select(currentModule, 'new')}>Add record</button></div>{records.length ? <ul>{records.map(item => <li key={item._id}><button disabled={busy} onClick={() => select(currentModule, item._id ?? null, item)}>{'title' in item ? item.title : item.name}</button><span>{'published' in item ? (item.published ? 'Published' : 'Draft') : (item.approved ? 'Approved' : 'Hidden')}</span></li>)}</ul> : <p>No records yet.</p>}</section>}
    {active && currentModule && <section className="admin-form"><h2>{currentModule === 'settings' ? 'Website settings' : selection === 'new' ? 'New record' : 'Edit record'}</h2>
      <form key={currentModule + selection} onSubmit={save}><fieldset disabled={busy}>
        {fields[currentModule].map(([key,label,type]) => {
          const value = String(form[key] ?? '')
          if (type === 'flag') return <label key={key} className="admin-check"><input type="checkbox" checked={Boolean(form[key])} onChange={event => set(key,event.target.checked)}/>{label}</label>
          if (type === 'rich') return <div key={key}><p className="field-label">{label}</p><RichEditor value={value} change={html => set(key, html)}/></div>
          if (type === 'parent') return <label key={key}>{label}<select required disabled={selection !== 'new'} value={value} onChange={event => set(key,event.target.value)}><option value="">Choose a category</option>{data.tutoring.map(subject => <option key={subject._id} value={subject._id}>{subject.title}</option>)}</select></label>
          if (type === 'category') return <label key={key}>{label}<select value={value} onChange={event => set(key,event.target.value)}>{categories.map(name => <option key={name}>{name}</option>)}</select></label>
          if (type === 'image') return <div key={key}><label>{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
            const file = event.target.files?.[0]
            if (!file) return
            const body = new FormData(); body.append('image', file)
            void task(async () => { const result = await api<{url: string}>('/images', 'POST', body); set(key,result.url) })
          }}/></label>{value && <div className="image-setting"><img src={value} alt="Current featured image"/><button type="button" onClick={() => set(key,'')}>Remove image</button></div>}</div>
          if (type === 'copy' || type === 'list' || type === 'faq') return <label key={key}>{label}{type === 'faq' && <small>Enter one question and answer per line, separated by a vertical bar.</small>}<textarea rows={type === 'copy' ? 4 : 5} value={value} onChange={event => set(key,event.target.value)} required={type === 'copy'}/></label>
          return <label key={key}>{label}<input type={type === 'rating' ? 'number' : ['number','date','email'].includes(type ?? '') ? type : 'text'} min={type === 'rating' ? 1 : type === 'number' ? 0 : undefined} max={type === 'rating' ? 5 : undefined} readOnly={currentModule === 'topics' && key === 'slug' && selection !== 'new'} value={value} onChange={event => set(key,event.target.value)} required={!['optional','rating','email'].includes(type ?? '')}/></label>
        })}
        <div className="actions"><button className="button">Save changes</button>
          {currentModule === 'topics' && <button className="button outline" type="button" onClick={() => void task(async () => setPreview(await api<Topic>('/preview-topic', 'POST', payload('topics', form))))}>Preview topic</button>}
          {currentModule === 'posts' && <button className="button outline" type="button" onClick={() => void task(async () => setPreview(await api<Post>('/preview', 'POST', payload('posts', form))))}>Preview article</button>}
          {currentModule !== 'settings' && selection !== 'new' && <button className="button outline" type="button" onClick={() => setConfirm(!confirm)}>Delete record</button>}
        </div>
        {confirm && <div className="actions"><p>Permanently delete this record?</p><button type="button" className="button" onClick={() => void task(async () => { await api('/' + currentModule + '/' + selection, 'DELETE'); await refresh(); select(currentModule); setNotice('Record deleted.') })}>Confirm deletion</button></div>}
      </fieldset></form>
    </section>}
    {preview && <section className="admin-preview"><button className="button outline" onClick={() => setPreview(null)}>Close preview</button>{'categoryId' in preview ? data.tutoring.filter(subject => subject._id === preview.categoryId).map(subject => <TopicDetail key={subject.slug} item={subject} topic={preview}/>) : <Article post={preview} preview/>}</section>}
  </main>
}
