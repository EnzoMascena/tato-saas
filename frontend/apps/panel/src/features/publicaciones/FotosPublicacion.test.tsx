import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json } from '@/pruebas'
import { abrir, artista, detalle, foto } from './pruebasPublicacion'

const jpg = (nombre: string) => new File(['contenido'], nombre, { type: 'image/jpeg' })

const elegirFotos = (...archivos: File[]) =>
  fireEvent.change(screen.getByLabelText('Elegir fotos'), { target: { files: archivos } })

/** Las versiones que mandó cada subida, en orden. */
const versionesSubidas = (pedidos: ReturnType<typeof abrir>) =>
  pedidos()
    .filter((p) => p.metodo === 'POST' && p.ruta.endsWith('/fotos'))
    .map((p) => (p.cuerpo as FormData).get('version'))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('fotos de una publicación', () => {
  it('muestra las fotos en orden con su miniatura, y la primera es la portada', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle({ fotos: [foto(1), foto(2), foto(3)] })),
    })

    await screen.findByRole('heading', { name: 'Fotos (3)' })

    expect(screen.getByAltText('Foto 1').getAttribute('src')).toBe('/api/fotos/f1/miniatura')
    expect(screen.getByAltText('Foto 3').getAttribute('src')).toBe('/api/fotos/f3/miniatura')
    // «Portada» es también el texto del botón de las otras fotos: acá se busca la etiqueta.
    screen.getByText('Portada', { selector: 'span' })
    screen.getByText('Foto 2', { selector: 'span' })
  })

  it('el selector deja elegir varias imágenes de la cámara o la galería', async () => {
    abrir('/publicaciones/p1', artista, { 'GET /api/publicaciones/p1': () => json(detalle()) })
    await screen.findByText('Todavía no hay fotos. La primera que agregues es la portada.')

    const entrada = screen.getByLabelText('Elegir fotos')

    expect(entrada.getAttribute('accept')).toBe('image/*')
    expect(entrada.hasAttribute('multiple')).toBe(true)
    // Con capture, el celular abriría solo la cámara y no ofrecería la galería.
    expect(entrada.hasAttribute('capture')).toBe(false)
  })

  it('las sube de a una, y cada subida usa la versión que devolvió la anterior', async () => {
    let subidas = 0
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle()),
      'POST /api/publicaciones/p1/fotos': () => {
        subidas++
        return json({ foto: foto(subidas), version: `v${subidas + 1}` }, 201)
      },
    })
    await screen.findByRole('heading', { name: 'Fotos (0)' })

    elegirFotos(jpg('a.jpg'), jpg('b.jpg'), jpg('c.jpg'))

    await screen.findByRole('heading', { name: 'Fotos (3)' })
    // Si fueran a la vez, las tres mandarían v1.
    expect(versionesSubidas(pedidos)).toEqual(['v1', 'v2', 'v3'])
    const primera = pedidos().find((p) => p.metodo === 'POST')!.cuerpo as FormData
    expect((primera.get('archivo') as File).name).toBe('a.jpg')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('una foto que la API rechaza muestra su mensaje, no frena a las demás y no cambia la versión', async () => {
    let llamada = 0
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle()),
      'POST /api/publicaciones/p1/fotos': () => {
        llamada++
        return llamada === 2
          ? json({ status: 422, detail: 'Una publicación no puede tener más de 10 fotos.', regla: 'RN-BLG-04' }, 422)
          : json({ foto: foto(llamada), version: `v${llamada + 1}` }, 201)
      },
    })
    await screen.findByRole('heading', { name: 'Fotos (0)' })

    elegirFotos(jpg('a.jpg'), jpg('segunda.jpg'), jpg('c.jpg'))

    await screen.findByText('Una publicación no puede tener más de 10 fotos.')
    await screen.findByRole('heading', { name: 'Fotos (2)' })
    // La segunda falló: la tercera sigue con la versión de la primera.
    expect(versionesSubidas(pedidos)).toEqual(['v1', 'v2', 'v2'])
    screen.getByText('segunda.jpg')

    fireEvent.click(screen.getByRole('button', { name: 'Descartar segunda.jpg' }))
    expect(screen.queryByText('segunda.jpg')).toBeNull()
  })

  it('muestra el estado de cada foto y cuántas lleva, y no deja guardar mientras sube', async () => {
    let terminar!: () => void
    const primera = new Promise<Response>((resolver) => {
      terminar = () => resolver(json({ foto: foto(1), version: 'v2' }, 201))
    })
    let llamada = 0
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle()),
      'POST /api/publicaciones/p1/fotos': () => (++llamada === 1 ? primera : json({ foto: foto(2), version: 'v3' }, 201)),
    })
    await screen.findByRole('heading', { name: 'Fotos (0)' })

    elegirFotos(jpg('a.jpg'), jpg('b.jpg'))

    await screen.findByText('Subiendo 1 de 2')
    screen.getByText('Subiendo…')
    screen.getByText('En cola')
    expect(screen.getByRole('button', { name: 'Guardar cambios' }).hasAttribute('disabled')).toBe(true)

    terminar()

    await screen.findByRole('heading', { name: 'Fotos (2)' })
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(screen.getByRole('button', { name: 'Guardar cambios' }).hasAttribute('disabled')).toBe(false)
  })

  it('si alguien cambió la publicación (409), corta la subida y avisa con Recargar', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle()),
      'POST /api/publicaciones/p1/fotos': () => json({ status: 409, detail: 'La modificó otra persona.' }, 409),
    })
    await screen.findByRole('heading', { name: 'Fotos (0)' })

    elegirFotos(jpg('a.jpg'), jpg('b.jpg'), jpg('c.jpg'))

    const aviso = await screen.findByRole('alert')
    expect(aviso.textContent).toContain('Alguien cambió esta publicación mientras la editabas.')
    screen.getByRole('button', { name: 'Recargar' })
    // Seguir con las otras dos chocaría de nuevo: se subió una sola vez.
    expect(versionesSubidas(pedidos)).toEqual(['v1'])
    expect(screen.queryByLabelText('Fotos que se están subiendo')).toBeNull()
  })
})
