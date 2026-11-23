import { Button } from '@/components/ui/button'

/**
 * Lo que salió mal en la última acción: un conflicto de versión (409) o cualquier otro error de la API, con el mensaje
 * que trae (un 403 dice por qué no tiene permiso, un 422 qué regla no se cumple).
 */
export type Aviso = { tipo: 'conflicto' } | { tipo: 'error'; mensaje: string }

export function AvisoDeError({ aviso, recargar }: { aviso: Aviso; recargar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive p-3 text-sm">
      {aviso.tipo === 'conflicto' ? (
        <>
          <p>
            Alguien cambió esta publicación mientras la editabas. Recargá para ver su cambio: lo que escribiste y no
            guardaste se pierde.
          </p>
          <Button onClick={recargar}>Recargar</Button>
        </>
      ) : (
        <p>{aviso.mensaje}</p>
      )}
    </div>
  )
}
