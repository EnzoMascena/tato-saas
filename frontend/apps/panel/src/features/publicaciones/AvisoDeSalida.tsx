import { useEffect, type RefObject } from 'react'
import { useBlocker } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * Avisa antes de salir de una pantalla con cambios sin guardar: al tocar un link o la barra de abajo, y al volver atrás,
 * pregunta; al cerrar o recargar la pestaña, el navegador muestra su propio aviso.
 *
 * salidaLibre: la pantalla lo prende justo antes de irse a propósito (por ejemplo, al crear la publicación y pasar a
 * editarla), así no se frena a sí misma.
 */
export function AvisoDeSalida({
  hayCambios,
  mensaje,
  salidaLibre,
}: {
  hayCambios: boolean
  mensaje: string
  salidaLibre?: RefObject<boolean>
}) {
  const bloqueo = useBlocker(() => hayCambios && !salidaLibre?.current)

  useEffect(() => {
    if (!hayCambios) return

    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)

    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayCambios])

  if (bloqueo.state !== 'blocked') return null

  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive p-3 text-sm">
      <p>{mensaje}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => bloqueo.reset()}>Seguir editando</Button>
        <Button variant="outline" onClick={() => bloqueo.proceed()}>
          Salir sin guardar
        </Button>
      </div>
    </div>
  )
}
