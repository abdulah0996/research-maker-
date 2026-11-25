import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app'
import './style.css'
import './cinematic.css'

const data = JSON.parse(document.getElementById('site-data')?.textContent || '{}')
hydrateRoot(document.getElementById('root')!, <BrowserRouter><App {...data}/></BrowserRouter>)

