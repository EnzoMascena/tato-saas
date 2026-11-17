import { useInfiniteQuery } from '@tanstack/react-query'
import {
  EstadoPublicacion,
  getListarPublicacionesQueryKey,
  listarPublicaciones,
  TipoPublicacion,
  type PublicacionResumen,
} from '@tato/api-client'
import { Pin } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { useSesion } from '@/features/sesion/sesion'

const estados = [
  { nombre: 'Todas' },
  { valor: EstadoPublicacion.Borrador, nombre: 'Borradores' },
  { valor: EstadoPublicacion.Publicada, nombre: 'Publicadas' },
  { valor: EstadoPublicacion.Oculta, nombre: 'Ocultas' },
]

const tipos = [
  { nombre: 'Todos' },
  { valor: TipoPublicacion.Trabajo, nombre: 'Trabajos' },
  { valor: TipoPublicacion.Blog, nombre: 'Blog' },
]

const paginas = [{ nombre: 'Mi página' }, { valor: 'estudio', nombre: 'Estudio' }]

// shortcut: la hora de Argentina para todos (D-43); si hay estudios en otra zona, que yo traiga la del estudio.
const formatoFecha = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/**
 * «Mis publicaciones» (doc 07, 8): las de una página, de la modificada más recientemente a la más vieja. La página y
 * los filtros van en la URL, así se conservan al volver de una publicación.
 */
export function Publicaciones() {
  const { data: usuario } = useSesion()
  const [busqueda, setBusqueda] = useSearchParams()

  // Un artista elige entre su página y la del estudio; los demás solo tienen la del estudio (D-51). Las opciones
  // salen de la sesión, no de las páginas creadas: se puede publicar en una página que todavía no existe.
  const tatuadorId = usuario?.tatuadorId
  const enElEstudio = !tatuadorId || busqueda.get('de') === 'estudio'
  const estado = elegido(busqueda.get('estado'), Object.values(EstadoPublicacion))
  const tipo = elegido(busqueda.get('tipo'), Object.values(TipoPublicacion))
  const filtro = { ...(enElEstudio || !tatuadorId ? { delEstudio: true } : { tatuadorId }), estado, tipo }

  const lista = useInfiniteQuery({
    queryKey: getListarPublicacionesQueryKey(filtro),
    queryFn: ({ pageParam, signal }) => listarPublicaciones({ ...filtro, pagina: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (ultima, todas) =>
      todas.reduce((cargadas, pagina) => cargadas + pagina.items.length, 0) < ultima.total
        ? ultima.numeroPagina + 1
        : undefined,
  })

  function elegir(parametro: string, valor?: string) {
    setBusqueda(
      (actual) => {
        const nueva = new URLSearchParams(actual)
        if (valor) nueva.set(parametro, valor)
        else nueva.delete(parametro)
        return nueva
      },
      { replace: true },
    )
  }

  const publicaciones = lista.data?.pages.flatMap((pagina) => pagina.items) ?? []
  // La publicación nueva va a la página elegida.
  const nueva = (tipoNueva: TipoPublicacion) =>
    `/publicaciones/nueva?tipo=${tipoNueva}${enElEstudio ? '&de=estudio' : ''}`

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Publicaciones</h1>

      <div className="flex flex-wrap gap-2">
        <Link className={buttonVariants()} to={nueva(TipoPublicacion.Trabajo)}>
          Nuevo trabajo
        </Link>
        <Link className={buttonVariants({ variant: 'outline' })} to={nueva(TipoPublicacion.Blog)}>
          Nueva entrada de blog
        </Link>
      </div>

      {tatuadorId && (
        <Opciones
          nombre="Página"
          opciones={paginas}
          elegida={enElEstudio ? 'estudio' : undefined}
          alElegir={(valor) => elegir('de', valor)}
        />
      )}
      <Opciones nombre="Estado" opciones={estados} elegida={estado} alElegir={(valor) => elegir('estado', valor)} />
      <Opciones nombre="Tipo" opciones={tipos} elegida={tipo} alElegir={(valor) => elegir('tipo', valor)} />

      {lista.isPending ? (
        <p>Cargando…</p>
      ) : lista.isError ? (
        <div className="flex flex-col items-start gap-3">
          <p>{lista.error.message}</p>
          <Button onClick={() => void lista.refetch()}>Reintentar</Button>
        </div>
      ) : publicaciones.length === 0 ? (
        <p className="text-muted-foreground">No hay publicaciones para mostrar.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {publicaciones.map((publicacion) => (
            <li key={publicacion.id}>
              <Fila publicacion={publicacion} />
            </li>
          ))}
        </ul>
      )}

      {lista.hasNextPage && (
        <Button variant="outline" disabled={lista.isFetchingNextPage} onClick={() => void lista.fetchNextPage()}>
          {lista.isFetchingNextPage ? 'Cargando…' : 'Ver más'}
        </Button>
      )}
    </div>
  )
}

/**
 * Un grupo de botones para elegir una opción, como un filtro. Botones y no una lista desplegable: se tocan con el
 * pulgar y se ve cuál está elegida.
 */
function Opciones({
  nombre,
  opciones,
  elegida,
  alElegir,
}: {
  nombre: string
  opciones: { valor?: string; nombre: string }[]
  elegida?: string
  alElegir: (valor?: string) => void
}) {
  return (
    <div role="group" aria-label={nombre} className="flex flex-wrap gap-2">
      {opciones.map((opcion) => (
        <Button
          key={opcion.nombre}
          size="sm"
          variant={opcion.valor === elegida ? 'default' : 'outline'}
          aria-pressed={opcion.valor === elegida}
          onClick={() => alElegir(opcion.valor)}
        >
          {opcion.nombre}
        </Button>
      ))}
    </div>
  )
}

/**
 * Una publicación de la lista. La portada va en 4:5, como en la grilla del sitio (docs/wireframes/sitio).
 */
function Fila({ publicacion }: { publicacion: PublicacionResumen }) {
  return (
    <Link to={`/publicaciones/${publicacion.id}`} className="flex gap-3 py-3">
      {publicacion.portadaFotoId ? (
        <img
          src={`/api/fotos/${publicacion.portadaFotoId}/miniatura`}
          alt=""
          loading="lazy"
          className="aspect-4/5 w-16 shrink-0 rounded-md bg-muted object-cover"
        />
      ) : (
        <span className="flex aspect-4/5 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-center text-xs text-muted-foreground">
          Sin fotos
        </span>
      )}

      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium">{publicacion.titulo}</span>
        <span className="text-sm text-muted-foreground">
          {publicacion.tipo} · {publicacion.estado}
        </span>
        {publicacion.destacada && (
          <span className="flex items-center gap-1 text-sm">
            <Pin aria-hidden className="size-4" />
            Fijada
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          Modificada el {formatoFecha.format(new Date(publicacion.actualizadaEn)).replace(',', '')}
        </span>
      </span>
    </Link>
  )
}

/**
 * El valor de un parámetro de la URL, si es uno de los válidos.
 */
function elegido<T extends string>(valor: string | null, validos: readonly T[]) {
  return validos.find((valido) => valido === valor)
}
