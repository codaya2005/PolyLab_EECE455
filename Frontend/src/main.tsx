import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { prefetchCsrfToken } from './lib/api'

const rootEl = document.getElementById('root') as HTMLElement
prefetchCsrfToken().catch(() => undefined)
createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
