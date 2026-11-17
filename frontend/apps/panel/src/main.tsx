import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { crearClienteQuery } from './features/sesion/sesion'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={crearClienteQuery()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
