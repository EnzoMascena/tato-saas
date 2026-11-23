import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Los mismos límites que el dominio: título de 120 caracteres (Publicacion.MaxTitulo) y texto de 2200, como Instagram
// (RN-BLG-11).
const MAX_TITULO = 120
const MAX_TEXTO = 2200

const esquema = z.object({
  titulo: z.string().trim().min(1, 'Escribí un título.').max(MAX_TITULO, `El título no puede pasar de ${MAX_TITULO} caracteres.`),
  descripcion: z.string().max(MAX_TEXTO, `El texto no puede pasar de ${MAX_TEXTO} caracteres.`),
  destacada: z.boolean(),
})

export type ValoresPublicacion = z.infer<typeof esquema>

/**
 * Los datos que se escriben de una publicación: título, texto (con contador) y si va fijada (RN-BLG-13). El texto
 * conserva los saltos de línea: el sitio lo muestra en párrafos.
 *
 * alGuardar devuelve true si la API aceptó el cambio; entonces lo guardado pasa a ser el valor «limpio» del formulario.
 */
export function FormularioPublicacion({
  valores,
  etiquetaGuardar,
  ocupado,
  alGuardar,
}: {
  valores: ValoresPublicacion
  etiquetaGuardar: string
  ocupado: boolean
  alGuardar: (valores: ValoresPublicacion) => Promise<boolean>
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(esquema), defaultValues: valores })

  const largoTexto = useWatch({ control, name: 'descripcion' }).length

  async function guardar(datos: ValoresPublicacion) {
    // La API recorta el texto: se manda y se guarda ya recortado.
    const guardados = { ...datos, descripcion: datos.descripcion.trim() }

    if (await alGuardar(guardados)) reset(guardados)
  }

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit(guardar)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          aria-invalid={errors.titulo ? true : undefined}
          aria-describedby={errors.titulo ? 'titulo-error' : undefined}
          {...register('titulo')}
        />
        {errors.titulo && (
          <p id="titulo-error" className="text-sm text-destructive">
            {errors.titulo.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="descripcion">Texto</Label>
        <Textarea
          id="descripcion"
          rows={8}
          aria-invalid={errors.descripcion ? true : undefined}
          aria-describedby={errors.descripcion ? 'descripcion-error contador' : 'contador'}
          {...register('descripcion')}
        />
        <p id="contador" className={`text-right text-sm ${largoTexto > MAX_TEXTO ? 'text-destructive' : 'text-muted-foreground'}`}>
          {largoTexto} / {MAX_TEXTO}
        </p>
        {errors.descripcion && (
          <p id="descripcion-error" className="text-sm text-destructive">
            {errors.descripcion.message}
          </p>
        )}
      </div>

      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" className="size-6" {...register('destacada')} />
        Fijada: aparece primero en la página
      </label>

      <Button type="submit" disabled={ocupado || isSubmitting}>
        {isSubmitting ? 'Guardando…' : etiquetaGuardar}
      </Button>
    </form>
  )
}
