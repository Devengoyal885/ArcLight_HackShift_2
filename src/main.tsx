import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { registerServiceWorker } from './services/pushNotificationService'

// Register service worker for PWA + push notification support
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
