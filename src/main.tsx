import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { requestPersistentStorage } from './lib/persist'
import { UpdateToast } from './pwa/UpdateToast'

// After the first use, ask the browser to keep the data of the home-screen app.
window.addEventListener('pointerdown', () => void requestPersistentStorage(navigator.storage), { once: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdateToast />
  </StrictMode>,
)
