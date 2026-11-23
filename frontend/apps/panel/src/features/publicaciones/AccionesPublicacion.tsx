import {
  confirmarConsentimiento,
  EstadoPublicacion,
  ocultarPublicacion,
  publicarPublicacion,
  type PublicacionDetalle,
  type UsuarioActualRespuesta,
} from '@tato/api-client'
import { Button } from '@/components/ui/button'
import { puedePublicarOcultar } from './permisos'
import type { CacheDePublicacion } from './useDetallePublicacion'

/**
 * El consentimiento del cliente (RN-BLG-03) y publicar u ocultar (RN-BLG-06). Ocultar no borra: la publicación cambia de
 * estado. Los botones de publicar y ocultar los ve solo quien puede usarlos (D-51).
 *
 * Publicar necesita al menos una foto y el consentimiento, y que lo escrito esté guardado: si falta algo, la pantalla
 * dice qué. La API lo controla igual.
 */
export function AccionesPublicacion({
  detalle,
  usuario,
  cache,
  ocupado,
  haySinGuardar,
  trabajar,
}: {
  detalle: PublicacionDetalle
  usuario: UsuarioActualRespuesta
  cache: CacheDePublicacion
  ocupado: boolean
  haySinGuardar: boolean
  trabajar: <T>(accion: () => Promise<T>) => Promise<T | undefined>
}) {
  const publicada = detalle.estado === EstadoPublicacion.Publicada
  const puede = puedePublicarOcultar(usuario, detalle)

  const faltan = [
    detalle.fotos.length === 0 && 'Agregá al menos una foto.',
    !detalle.tieneConsentimiento && 'Confirmá que el cliente aceptó que se publiquen las fotos.',
    haySinGuardar && 'Guardá los cambios antes de publicar.',
  ].filter((falta) => falta !== false)

  function confirmar() {
    return trabajar(async () => {
      const { version } = await confirmarConsentimiento(detalle.id, { version: cache.actual().version })
      cache.parchear(() => ({ tieneConsentimiento: true, version }))
    })
  }

  function cambiarEstado(estado: EstadoPublicacion) {
    const cambiar = estado === EstadoPublicacion.Publicada ? publicarPublicacion : ocultarPublicacion

    return trabajar(async () => {
      const { version } = await cambiar(detalle.id, { version: cache.actual().version })
      cache.parchear(() => ({ estado, version }))
    })
  }

  return (
    <section aria-labelledby="publicar-titulo" className="flex flex-col gap-3">
      <h2 id="publicar-titulo" className="text-lg font-semibold">
        Publicar
      </h2>

      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          className="mt-2 size-6"
          checked={detalle.tieneConsentimiento}
          // Una vez confirmado queda registrado, y no se desmarca.
          disabled={detalle.tieneConsentimiento || ocupado}
          onChange={() => void confirmar()}
        />
        <span className="py-2">El cliente aceptó que se publiquen las fotos</span>
      </label>
      <p className="text-sm text-muted-foreground">
        {detalle.tieneConsentimiento
          ? 'Confirmado. Queda registrado quién lo confirmó y cuándo, y no se puede desmarcar.'
          : 'Al confirmarlo queda registrado quién lo hizo y cuándo, y no se puede desmarcar.'}
      </p>

      {!puede ? (
        <p className="text-sm text-muted-foreground">
          {detalle.tatuadorId === null
            ? 'Solo un Dueño o un Administrativo puede publicar u ocultar las publicaciones del estudio.'
            : 'Solo el artista de esta página puede publicar u ocultar sus publicaciones.'}
        </p>
      ) : publicada ? (
        <Button type="button" variant="outline" disabled={ocupado} onClick={() => void cambiarEstado(EstadoPublicacion.Oculta)}>
          Ocultar
        </Button>
      ) : (
        <>
          {faltan.length > 0 && (
            <div className="text-sm">
              <p>Para publicar falta:</p>
              <ul className="list-disc pl-5">
                {faltan.map((falta) => (
                  <li key={falta}>{falta}</li>
                ))}
              </ul>
            </div>
          )}
          <Button
            type="button"
            disabled={ocupado || faltan.length > 0}
            onClick={() => void cambiarEstado(EstadoPublicacion.Publicada)}
          >
            {detalle.estado === EstadoPublicacion.Oculta ? 'Volver a publicar' : 'Publicar'}
          </Button>
        </>
      )}
    </section>
  )
}
