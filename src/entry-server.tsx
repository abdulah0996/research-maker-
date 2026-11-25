import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { App, resolve } from './app'
import { defaults } from './content'
import type { Content } from './types'

export function render(url: string, content: Content = defaults, unavailable = false, base?: string) {
  const pathname = new URL(url, 'http://localhost').pathname
  const { meta, status } = resolve(pathname, content, unavailable)
  return { meta, status, markup: renderToString(<StaticRouter location={url}><App content={content} unavailable={unavailable} base={base}/></StaticRouter>) }
}
