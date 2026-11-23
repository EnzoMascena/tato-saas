import { Button } from '@/components/ui/button'

/**
 * Un grupo de botones para elegir una opción, como un filtro. Botones y no una lista desplegable: se tocan con el
 * pulgar y se ve cuál está elegida.
 */
export function Opciones({
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
          type="button"
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
