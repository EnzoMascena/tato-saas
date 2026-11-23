import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { rutas } from './App.tsx'
import './index.css'
import { crearClienteQuery } from './features/sesion/sesion'

const router = createBrowserRouter(rutas)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={crearClienteQuery()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
