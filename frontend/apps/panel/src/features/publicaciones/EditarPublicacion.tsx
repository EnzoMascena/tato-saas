import { crearPublicacion, editarPublicacion, TipoPublicacion, type PublicacionDetalle } from '@tato/api-client'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useSesion } from '@/features/sesion/sesion'
import { elegido } from '@/lib/elegido'
import { AvisoDeError } from './AvisoDeError'
import { FormularioPublicacion, type ValoresPublicacion } from './FormularioPublicacion'
import { Opciones } from './Opciones'
import { useAvisos } from './useAvisos'
import { useCacheDePublicacion, useDetallePublicacion } from './useDetallePublicacion'

const volver = (
  <Link to="/publicaciones" className="inline-flex min-h-11 items-center underline underline-offset-4">
    Volver a las publicaciones
  </Link>
)

/**
 * Crear o editar una publicación (doc 07, 8): /publicaciones/nueva para crear y /publicaciones/{id} para editar.
 */
export function EditarPublicacion() {
  const { id } = useParams()

  // Con key, pasar de crear a editar (al guardar por primera vez) arranca la pantalla de cero.
  return <Pantalla key={id ?? 'nueva'} id={id} />
}

function Pantalla({ id }: { id?: string }) {
  const detalle = useDetallePublicacion(id)

  if (!id) return <Creacion />

  if (detalle.isPending) return <p className="p-4">Cargando…</p>

  if (detalle.isError)
    return (
      <div className="flex flex-col items-start gap-3 p-4">
        <p>{detalle.error.message}</p>
        {volver}
      </div>
    )

  return <Edicion detalle={detalle.data} recargar={async () => (await detalle.refetch()).data} />
}

/**
 * Una publicación nueva. La página se elige acá y después no cambia: un artista elige entre la suya y la del estudio; los
 * demás publican en la del estudio (D-51). Se crea al primer guardado, porque hace falta el título; ahí pasa a la pantalla
 * de edición, donde ya se pueden agregar fotos.
 */
function Creacion() {
  const { data: usuario } = useSesion()
  const [busqueda] = useSearchParams()
  const navigate = useNavigate()
  const { aviso, intentar } = useAvisos()

  const tipo = elegido(busqueda.get('tipo'), Object.values(TipoPublicacion)) ?? TipoPublicacion.Trabajo
  const tatuadorDelUsuario = usuario?.tatuadorId ?? null
  const [enElEstudio, setEnElEstudio] = useState(!tatuadorDelUsuario || busqueda.get('de') === 'estudio')

  async function crear(valores: ValoresPublicacion) {
    const creada = await intentar(() =>
      crearPublicacion({
        titulo: valores.titulo,
        descripcion: valores.descripcion || null,
        fechaTrabajo: null,
        estiloId: null,
        zonaCuerpoId: null,
        tatuadorId: enElEstudio ? null : tatuadorDelUsuario,
        destacada: valores.destacada,
        tipo,
      }),
    )

    if (!creada) return false

    void navigate(`/publicaciones/${creada.id}`, { replace: true })
    return true
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {volver}
      <h1 className="text-xl font-semibold">{tipo === TipoPublicacion.Blog ? 'Nueva entrada de blog' : 'Nuevo trabajo'}</h1>

      {tatuadorDelUsuario && (
        <Opciones
          nombre="Página"
          opciones={[
            { valor: 'mia', nombre: 'Mi página' },
            { valor: 'estudio', nombre: 'Estudio' },
          ]}
          elegida={enElEstudio ? 'estudio' : 'mia'}
          alElegir={(valor) => setEnElEstudio(valor === 'estudio')}
        />
      )}

      {aviso && <AvisoDeError aviso={aviso} recargar={() => undefined} />}

      <FormularioPublicacion
        valores={{ titulo: '', descripcion: '', destacada: false }}
        etiquetaGuardar="Crear publicación"
        ocupado={false}
        alGuardar={crear}
      />
    </div>
  )
}

/**
 * Una publicación que ya existe. Cada cambio que acepta la API trae la versión nueva, que se guarda en la caché para el
 * siguiente. Mientras algo se está guardando (trabajando), no se puede empezar otro cambio: usarían la misma versión y
 * el segundo chocaría con el primero.
 */
function Edicion({
  detalle,
  recargar,
}: {
  detalle: PublicacionDetalle
  recargar: () => Promise<PublicacionDetalle | undefined>
}) {
  const { data: usuario } = useSesion()
  const cache = useCacheDePublicacion(detalle.id)
  const { aviso, intentar, limpiar } = useAvisos()
  const [trabajando, setTrabajando] = useState(0)
  // Con qué arranca el formulario: lo que se abrió, o lo que trajo Recargar.
  const [base, setBase] = useState(detalle)
  const [carga, setCarga] = useState(0)

  async function trabajar<T>(accion: () => Promise<T>) {
    setTrabajando((n) => n + 1)

    try {
      return await intentar(accion)
    } finally {
      setTrabajando((n) => n - 1)
    }
  }

  async function guardar(valores: ValoresPublicacion) {
    const actual = cache.actual()
    const respuesta = await trabajar(() =>
      editarPublicacion(actual.id, {
        titulo: valores.titulo,
        descripcion: valores.descripcion || null,
        // El PUT reemplaza todo: lo que esta pantalla no muestra va con el valor que tenía, o se borra (doc 07, 6).
        fechaTrabajo: actual.fechaTrabajo,
        estiloId: actual.estiloId,
        zonaCuerpoId: actual.zonaCuerpoId,
        tatuadorId: actual.tatuadorId,
        destacada: valores.destacada,
        tipo: actual.tipo,
        version: actual.version,
      }),
    )

    if (!respuesta) return false

    cache.parchear(() => ({
      titulo: valores.titulo,
      descripcion: valores.descripcion || null,
      destacada: valores.destacada,
      version: respuesta.version,
    }))
    return true
  }

  async function recargarTodo() {
    const nueva = await recargar()

    if (!nueva) return

    limpiar()
    // Con otra key, el formulario arranca de nuevo con lo que trajo la API.
    setBase(nueva)
    setCarga((n) => n + 1)
  }

  const esBlog = detalle.tipo === TipoPublicacion.Blog
  const pagina =
    detalle.tatuadorId === null
      ? 'Página del estudio'
      : detalle.tatuadorId === usuario?.tatuadorId
        ? 'Mi página'
        : 'Página de otro artista'

  return (
    <div className="flex flex-col gap-4 p-4">
      {volver}
      <h1 className="text-xl font-semibold">{esBlog ? 'Editar entrada de blog' : 'Editar trabajo'}</h1>
      <p className="text-sm text-muted-foreground">
        {pagina} · {detalle.estado}
      </p>

      {aviso && <AvisoDeError aviso={aviso} recargar={() => void recargarTodo()} />}

      <FormularioPublicacion
        key={carga}
        valores={{ titulo: base.titulo, descripcion: base.descripcion ?? '', destacada: base.destacada }}
        etiquetaGuardar="Guardar cambios"
        ocupado={trabajando > 0}
        alGuardar={guardar}
      />
    </div>
  )
}
