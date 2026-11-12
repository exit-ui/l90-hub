import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { requestPersistentStorage } from './lib/persist'
import { listenForInstallPrompt } from './pwa/installPrompt'
import { UpdateToast } from './pwa/UpdateToast'

// After the first use, ask the browser to keep the data of the home-screen app.
window.addEventListener('pointerdown', () => void requestPersistentStorage(navigator.storage), { once: true })

// Chrome on Android sends its install event early; keep it for the "Install the app" pill.
listenForInstallPrompt()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdateToast />
  </StrictMode>,
)
