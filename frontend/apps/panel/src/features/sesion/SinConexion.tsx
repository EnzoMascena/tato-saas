import { Button } from '@/components/ui/button'

/**
 * Cuando no se pudo pedir la sesión: la API no responde o no hay conexión.
 */
export function SinConexion({ reintentar }: { reintentar: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 p-4">
      <p>No pudimos conectar con el servidor.</p>
      <Button onClick={reintentar}>Reintentar</Button>
    </div>
  )
}
