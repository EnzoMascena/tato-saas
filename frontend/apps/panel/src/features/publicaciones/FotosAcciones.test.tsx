import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json } from '@/pruebas'
import { abrir, artista, detalle, foto } from './pruebasPublicacion'

const tresFotos = () => json(detalle({ fotos: [foto(1), foto(2), foto(3)] }))

/** Las fotos que se ven, en el orden de la pantalla. */
const idsEnPantalla = () => screen.getAllByRole('img').map((img) => img.getAttribute('src')?.split('/')[3])

const cambios = (pedidos: ReturnType<typeof abrir>, quien: string) =>
  pedidos().filter((p) => p.metodo !== 'GET' && p.ruta.includes(quien))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ordenar, portada y quitar', () => {
  it('Bajar manda el orden nuevo con la versión, y la lista y la portada cambian', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': tresFotos,
      'PUT /api/publicaciones/p1/fotos/orden': () => json({ version: 'v2' }),
    })
    await screen.findByRole('heading', { name: 'Fotos (3)' })

    fireEvent.click(screen.getByRole('button', { name: 'Bajar la foto 1' }))

    await waitFor(() => expect(idsEnPantalla()).toEqual(['f2', 'f1', 'f3']))
    expect(cambios(pedidos, '/fotos/orden')[0].cuerpo).toEqual({ fotoIds: ['f2', 'f1', 'f3'], version: 'v1' })
    // Ahora la portada es la que estaba segunda.
    expect(screen.getByAltText('Foto 1').getAttribute('src')).toBe('/api/fotos/f2/miniatura')
  })

  it('Subir mueve la foto un lugar hacia arriba', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': tresFotos,
      'PUT /api/publicaciones/p1/fotos/orden': () => json({ version: 'v2' }),
    })
    await screen.findByRole('heading', { name: 'Fotos (3)' })

    fireEvent.click(screen.getByRole('button', { name: 'Subir la foto 3' }))

    await waitFor(() => expect(idsEnPantalla()).toEqual(['f1', 'f3', 'f2']))
    expect(cambios(pedidos, '/fotos/orden')[0].cuerpo.fotoIds).toEqual(['f1', 'f3', 'f2'])
  })

  it('la primera no se puede subir, la última no se puede bajar, y la portada no ofrece «Portada»', async () => {
    abrir('/publicaciones/p1', artista, { 'GET /api/publicaciones/p1': tresFotos })
    await screen.findByRole('heading', { name: 'Fotos (3)' })

    expect(screen.getByRole('button', { name: 'Subir la foto 1' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Bajar la foto 3' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Bajar la foto 1' }).hasAttribute('disabled')).toBe(false)
    expect(screen.queryByRole('button', { name: 'Elegir la foto 1 como portada' })).toBeNull()
    screen.getByRole('button', { name: 'Elegir la foto 3 como portada' })
  })

  it('Portada pone esa foto primera, y las demás siguen en su orden', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': tresFotos,
      'POST /api/publicaciones/p1/fotos/f3/portada': () => json({ version: 'v2' }),
    })
    await screen.findByRole('heading', { name: 'Fotos (3)' })

    fireEvent.click(screen.getByRole('button', { name: 'Elegir la foto 3 como portada' }))

    await waitFor(() => expect(idsEnPantalla()).toEqual(['f3', 'f1', 'f2']))
    expect(cambios(pedidos, '/f3/portada')[0].cuerpo).toEqual({ version: 'v1' })
  })

  it('quitar pide confirmación: Cancelar no manda nada, y Sí, quitar la saca', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': tresFotos,
      'POST /api/publicaciones/p1/fotos/f2/quitar': () => json({ version: 'v2' }),
    })
    await screen.findByRole('heading', { name: 'Fotos (3)' })

    fireEvent.click(screen.getByRole('button', { name: 'Quitar la foto 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(cambios(pedidos, '/quitar')).toHaveLength(0)
    expect(idsEnPantalla()).toEqual(['f1', 'f2', 'f3'])

    fireEvent.click(screen.getByRole('button', { name: 'Quitar la foto 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar la foto 2' }))

    await screen.findByRole('heading', { name: 'Fotos (2)' })
    expect(idsEnPantalla()).toEqual(['f1', 'f3'])
    expect(cambios(pedidos, '/f2/quitar')[0].cuerpo).toEqual({ version: 'v1' })
  })

  it('la versión sigue encadenada entre acciones distintas, sin recargar', async () => {
    let version = 1
    const siguiente = () => json({ version: `v${++version}` })
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': tresFotos,
      'PUT /api/publicaciones/p1/fotos/orden': siguiente,
      'POST /api/publicaciones/p1/fotos/f3/portada': siguiente,
      'POST /api/publicaciones/p1/fotos/f1/quitar': siguiente,
    })
    await screen.findByRole('heading', { name: 'Fotos (3)' })

    fireEvent.click(screen.getByRole('button', { name: 'Bajar la foto 1' }))
    await waitFor(() => expect(idsEnPantalla()).toEqual(['f2', 'f1', 'f3']))
    fireEvent.click(screen.getByRole('button', { name: 'Elegir la foto 3 como portada' }))
    await waitFor(() => expect(idsEnPantalla()).toEqual(['f3', 'f2', 'f1']))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar la foto 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar la foto 3' }))
    await screen.findByRole('heading', { name: 'Fotos (2)' })

    const versiones = pedidos()
      .filter((p) => p.metodo !== 'GET')
      .map((p) => p.cuerpo.version)
    expect(versiones).toEqual(['v1', 'v2', 'v3'])
    expect(pedidos().filter((p) => p.metodo === 'GET')).toHaveLength(1)
  })

  it('si la API no deja quitar la foto (RN-BLG-04), muestra su mensaje y la foto sigue', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle({ estado: 'Publicada', fotos: [foto(1)] })),
      'POST /api/publicaciones/p1/fotos/f1/quitar': () =>
        json({ status: 422, detail: 'Una publicación publicada no puede quedarse sin fotos.', regla: 'RN-BLG-04' }, 422),
    })
    await screen.findByRole('heading', { name: 'Fotos (1)' })

    fireEvent.click(screen.getByRole('button', { name: 'Quitar la foto 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar la foto 1' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Una publicación publicada no puede quedarse sin fotos.')
    screen.getByRole('heading', { name: 'Fotos (1)' })
  })

  it('si alguien cambió la publicación (409), avisa con Recargar y no cambia nada', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': tresFotos,
      'PUT /api/publicaciones/p1/fotos/orden': () => json({ status: 409, detail: 'La modificó otra persona.' }, 409),
    })
    await screen.findByRole('heading', { name: 'Fotos (3)' })

    fireEvent.click(screen.getByRole('button', { name: 'Bajar la foto 1' }))

    await screen.findByRole('button', { name: 'Recargar' })
    expect(idsEnPantalla()).toEqual(['f1', 'f2', 'f3'])
  })
})
