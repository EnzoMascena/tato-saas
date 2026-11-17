import { useQueryClient } from '@tanstack/react-query'
import { useCerrarSesion } from '@tato/api-client'
import { Button } from '@/components/ui/button'

/**
 * Cierra la sesión. Después borra lo que quedó en memoria de esta persona y vuelve a pedir la sesión, que trae el token
 * antiforgery nuevo: sin sesión, las rutas llevan al inicio de sesión.
 */
export function CerrarSesion() {
  const cliente = useQueryClient()
  const logout = useCerrarSesion({ mutation: { onSuccess: () => cliente.resetQueries() } })

  return (
    <Button variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()}>
      Cerrar sesión
    </Button>
  )
}
