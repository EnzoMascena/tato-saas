import {
  elegirPortada,
  ErrorApi,
  quitarFoto,
  reordenarFotos,
  subirFoto,
  type FotoDePublicacion,
} from '@tato/api-client'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { achicarFoto } from '@/lib/achicarFoto'
import type { CacheDePublicacion } from './useDetallePublicacion'

type Pendiente = { clave: number; nombre: string; estado: 'En cola' | 'Subiendo' | 'Error'; error?: string }

/**
 * Las fotos de la publicación (RN-BLG-04, RN-BLG-05): las que ya tiene, en orden, y un botón para agregar desde la cámara
 * o la galería.
 *
 * Se suben de a una, porque cada subida usa la versión que devolvió la anterior: dos a la vez usarían la misma y la
 * segunda chocaría con la primera (409). Cada foto muestra su estado, y una que la API rechaza (el máximo del estudio, un
 * formato que no sirve) muestra su mensaje y no frena a las demás.
 *
 * Para ordenar hay botones ↑ y ↓ y no arrastrar, que en el celular anda peor. La primera es la portada (RN-BLG-04).
 * ocupado: hay otro cambio en marcha, y empezar uno usaría la misma versión.
 */
export function FotosPublicacion({
  id,
  fotos,
  cache,
  ocupado,
  trabajar,
  avisar,
}: {
  id: string
  fotos: FotoDePublicacion[]
  cache: CacheDePublicacion
  ocupado: boolean
  trabajar: <T>(accion: () => Promise<T>) => Promise<T | undefined>
  avisar: (error: ErrorApi) => void
}) {
  const entrada = useRef<HTMLInputElement>(null)
  // La foto que se está por quitar, esperando que la persona confirme: quitar borra sus archivos.
  const [porQuitar, setPorQuitar] = useState<string>()
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [progreso, setProgreso] = useState<{ hechas: number; total: number }>()
  const cola = useRef<{ clave: number; archivo: File }[]>([])
  const procesando = useRef(false)
  const siguienteClave = useRef(0)

  function marcar(clave: number, cambios: Partial<Pendiente>) {
    setPendientes((actuales) => actuales.map((p) => (p.clave === clave ? { ...p, ...cambios } : p)))
  }

  function descartar(clave: number) {
    setPendientes((actuales) => actuales.filter((p) => p.clave !== clave))
  }

  function agregar(archivos: File[]) {
    const nuevos = archivos.map((archivo) => ({ clave: siguienteClave.current++, archivo }))

    cola.current.push(...nuevos)
    setPendientes((actuales) => [
      ...actuales,
      ...nuevos.map(({ clave, archivo }) => ({ clave, nombre: archivo.name, estado: 'En cola' as const })),
    ])
    setProgreso((actual) => ({ hechas: actual?.hechas ?? 0, total: (actual?.total ?? 0) + nuevos.length }))

    // Si ya hay una subida en marcha, la misma tanda levanta las fotos nuevas.
    if (!procesando.current) void procesar()
  }

  // El cambio y el guardado de la versión nueva van juntos, dentro del candado: nadie empieza otro entre medio.
  function ordenar(nuevoOrden: FotoDePublicacion[]) {
    return trabajar(async () => {
      const { version } = await reordenarFotos(id, {
        fotoIds: nuevoOrden.map((foto) => foto.id),
        version: cache.actual().version,
      })
      cache.parchear(() => ({ fotos: nuevoOrden, version }))
    })
  }

  function mover(indice: number, hacia: -1 | 1) {
    const nuevoOrden = [...fotos]
    ;[nuevoOrden[indice], nuevoOrden[indice + hacia]] = [nuevoOrden[indice + hacia], nuevoOrden[indice]]

    return ordenar(nuevoOrden)
  }

  function ponerDePortada(foto: FotoDePublicacion) {
    return trabajar(async () => {
      const { version } = await elegirPortada(id, foto.id, { version: cache.actual().version })
      cache.parchear((detalle) => ({
        fotos: [foto, ...detalle.fotos.filter((otra) => otra.id !== foto.id)],
        version,
      }))
    })
  }

  function quitar(foto: FotoDePublicacion) {
    setPorQuitar(undefined)

    return trabajar(async () => {
      const { version } = await quitarFoto(id, foto.id, { version: cache.actual().version })
      cache.parchear((detalle) => ({ fotos: detalle.fotos.filter((otra) => otra.id !== foto.id), version }))
    })
  }

  async function procesar() {
    procesando.current = true

    try {
      await trabajar(async () => {
        while (cola.current.length > 0) {
          const { clave, archivo } = cola.current[0]
          marcar(clave, { estado: 'Subiendo' })

          try {
            const achicada = await achicarFoto(archivo)
            // La versión se lee de la caché en cada foto: es la que devolvió la anterior.
            const subida = await subirFoto(id, { archivo: achicada, version: cache.actual().version })

            cache.parchear((detalle) => ({ fotos: [...detalle.fotos, subida.foto], version: subida.version }))
            descartar(clave)
          } catch (error) {
            if (!(error instanceof ErrorApi)) throw error

            if (error.status === 409) {
              // Alguien cambió la publicación: seguir subiendo con una versión vieja chocaría de nuevo con cada foto.
              cola.current = []
              setPendientes([])
              avisar(error)
              return
            }

            marcar(clave, { estado: 'Error', error: error.detail })
          }

          cola.current.shift()
          setProgreso((actual) => actual && { ...actual, hechas: actual.hechas + 1 })
        }
      })
    } finally {
      procesando.current = false
      cola.current = []
      setProgreso(undefined)
    }
  }

  return (
    <section aria-labelledby="fotos-titulo" className="flex flex-col gap-3">
      <h2 id="fotos-titulo" className="text-lg font-semibold">
        Fotos ({fotos.length})
      </h2>

      {/* Sin capture: así el celular ofrece sacar una foto o elegirla de la galería. */}
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-label="Elegir fotos"
        onChange={(evento) => {
          agregar([...(evento.target.files ?? [])])
          // Para poder elegir de nuevo la misma foto.
          evento.target.value = ''
        }}
      />
      <Button type="button" variant="outline" onClick={() => entrada.current?.click()}>
        Agregar fotos
      </Button>

      {progreso && (
        <p role="status" className="text-sm">
          Subiendo {Math.min(progreso.hechas + 1, progreso.total)} de {progreso.total}
        </p>
      )}

      {pendientes.length > 0 && (
        <ul aria-label="Fotos que se están subiendo" className="flex flex-col gap-2 text-sm">
          {pendientes.map((pendiente) => (
            <li key={pendiente.clave} className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 truncate">{pendiente.nombre}</span>
              {pendiente.estado === 'Error' ? (
                <span className="flex items-center gap-2 text-destructive">
                  {pendiente.error}
                  <Button type="button" size="sm" variant="outline" onClick={() => descartar(pendiente.clave)}>
                    Descartar {pendiente.nombre}
                  </Button>
                </span>
              ) : (
                <span className="text-muted-foreground">{pendiente.estado === 'Subiendo' ? 'Subiendo…' : 'En cola'}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {fotos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay fotos. La primera que agregues es la portada.</p>
      ) : (
        <ol className="flex flex-col divide-y">
          {fotos.map((foto, indice) => (
            <li key={foto.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center gap-3">
                <img
                  src={`/api/fotos/${foto.id}/miniatura`}
                  alt={`Foto ${indice + 1}`}
                  loading="lazy"
                  className="aspect-4/5 w-16 shrink-0 rounded-md bg-muted object-cover"
                />
                <span className="font-medium">{indice === 0 ? 'Portada' : `Foto ${indice + 1}`}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Subir la foto ${indice + 1}`}
                  disabled={ocupado || indice === 0}
                  onClick={() => void mover(indice, -1)}
                >
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Bajar la foto ${indice + 1}`}
                  disabled={ocupado || indice === fotos.length - 1}
                  onClick={() => void mover(indice, 1)}
                >
                  <ArrowDown aria-hidden />
                </Button>
                {indice > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Elegir la foto ${indice + 1} como portada`}
                    disabled={ocupado}
                    onClick={() => void ponerDePortada(foto)}
                  >
                    Portada
                  </Button>
                )}
                {porQuitar === foto.id ? (
                  <>
                    <Button type="button" variant="destructive" disabled={ocupado} onClick={() => void quitar(foto)}>
                      Sí, quitar la foto {indice + 1}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setPorQuitar(undefined)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={`Quitar la foto ${indice + 1}`}
                    disabled={ocupado}
                    onClick={() => setPorQuitar(foto.id)}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
