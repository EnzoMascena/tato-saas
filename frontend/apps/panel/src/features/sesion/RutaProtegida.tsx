import { Navigate, Outlet } from 'react-router'
import { useSesion } from './sesion'
import { SinConexion } from './SinConexion'

/**
 * Las rutas que exigen sesión: sin sesión, al inicio de sesión.
 */
export function RutaProtegida() {
  const sesion = useSesion()

  if (sesion.isPending) return <p className="p-4">Cargando…</p>

  if (sesion.isError) return <SinConexion reintentar={() => void sesion.refetch()} />

  return sesion.data ? <Outlet /> : <Navigate to="/ingresar" replace />
}
