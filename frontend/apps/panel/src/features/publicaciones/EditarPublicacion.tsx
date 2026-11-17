import { Link } from 'react-router'

/**
 * Crear o editar una publicación (doc 07, 8). Llega en el bloque 3: por ahora, solo el lugar al que llevan la lista y
 * los botones para crear.
 */
export function EditarPublicacion() {
  return (
    <div className="flex flex-col items-start gap-3 p-4">
      <h1 className="text-xl font-semibold">Publicación</h1>
      <p className="text-muted-foreground">Crear y editar publicaciones llega en el próximo bloque.</p>
      <Link to="/publicaciones" className="underline underline-offset-4">
        Volver a las publicaciones
      </Link>
    </div>
  )
}
