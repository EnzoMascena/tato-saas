import { Navigate } from 'react-router'
import { useSesion } from './sesion'

/**
 * Inicio de sesión (doc 07, 8). Con sesión, va directo a las publicaciones.
 */
export function Ingresar() {
  const sesion = useSesion()

  if (sesion.data) return <Navigate to="/publicaciones" replace />

  return <h1 className="p-4 text-xl font-semibold">Iniciar sesión</h1>
}
