import { Navigate, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSesion } from './sesion'

/**
 * Las rutas que exigen sesión: sin sesión, al inicio de sesión.
 */
export function RutaProtegida() {
  const sesion = useSesion()

  if (sesion.isPending) return <p className="p-4">Cargando…</p>

  if (sesion.isError)
    return (
      <div className="flex flex-col items-start gap-3 p-4">
        <p>No pudimos conectar con el servidor.</p>
        <Button onClick={() => void sesion.refetch()}>Reintentar</Button>
      </div>
    )

  return sesion.data ? <Outlet /> : <Navigate to="/ingresar" replace />
}
