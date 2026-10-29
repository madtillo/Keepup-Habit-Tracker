import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initSync } from './lib/sync'
import './styles.css'

initSync()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Service Worker:', err))
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
