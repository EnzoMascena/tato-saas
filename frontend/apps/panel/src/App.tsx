import { Navigate, type RouteObject } from 'react-router'
import { MiPagina } from '@/features/paginas/MiPagina'
import { EditarPublicacion } from '@/features/publicaciones/EditarPublicacion'
import { Publicaciones } from '@/features/publicaciones/Publicaciones'
import { Ingresar } from '@/features/sesion/Ingresar'
import { RutaProtegida } from '@/features/sesion/RutaProtegida'
import { MarcoDelPanel } from '@/MarcoDelPanel'

/**
 * Las rutas del panel. Van como objetos y no como <Routes>, porque useBlocker (el aviso de cambios sin guardar) solo
 * anda con un router de datos: createBrowserRouter en la app, createMemoryRouter en los tests.
 */
export const rutas: RouteObject[] = [
  { path: '/ingresar', element: <Ingresar /> },
  {
    element: <RutaProtegida />,
    children: [
      {
        element: <MarcoDelPanel />,
        children: [
          { path: '/publicaciones', element: <Publicaciones /> },
          { path: '/publicaciones/nueva', element: <EditarPublicacion /> },
          { path: '/publicaciones/:id', element: <EditarPublicacion /> },
          { path: '/mi-pagina', element: <MiPagina /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/publicaciones" replace /> },
]
