import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, renderizarPanel, simularApi } from '@/pruebas'

const antiforgery = () => json({ token: 'token', encabezado: 'X-XSRF-TOKEN' })
const artista = { id: 'u1', email: 'ink@ejemplo.com', nombre: 'Ink', estudioId: 'e1', roles: ['Tatuador'], tatuadorId: 't1' }
const administrativo = { ...artista, roles: ['Administrativo'], tatuadorId: null }

const publicacion = (id: string, cambios: object = {}) => ({
  id,
  titulo: `Trabajo ${id}`,
  tipo: 'Trabajo',
  estado: 'Borrador',
  destacada: false,
  fechaTrabajo: null,
  actualizadaEn: '2026-11-17T13:30:00+00:00',
  portadaFotoId: null,
  cantidadFotos: 0,
  tatuadorId: 't1',
  ...cambios,
})

const pagina = (items: object[], total = items.length, numeroPagina = 1) =>
  json({ items, numeroPagina, tamanioPagina: 20, total })

/**
 * El panel con sesión de esa persona y la lista que diga el test. Devuelve los parámetros de cada pedido de la lista.
 */
function abrirPublicaciones(usuario: object, lista: (url: URL) => Response = () => pagina([publicacion('p1')])) {
  const api = simularApi({
    'GET /api/auth/antiforgery': antiforgery,
    'GET /api/auth/yo': () => json(usuario),
    'GET /api/publicaciones': lista,
  })
  renderizarPanel('/publicaciones')

  return () =>
    api.mock.calls
      .map(([url]) => new URL(url, 'https://localhost'))
      .filter((url) => url.pathname === '/api/publicaciones')
      .map((url) => url.searchParams)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Mis publicaciones', () => {
  it('un artista elige entre su página y la del estudio, y cada una pide solo lo suyo', async () => {
    const pedidos = abrirPublicaciones(artista)
    await screen.findByText('Trabajo p1')

    expect(pedidos()[0].get('tatuadorId')).toBe('t1')
    fireEvent.click(screen.getByRole('button', { name: 'Estudio' }))

    await waitFor(() => expect(pedidos().at(-1)?.get('delEstudio')).toBe('true'))
    expect(pedidos().at(-1)?.has('tatuadorId')).toBe(false)
  })

  it('un Administrativo ve solo la del estudio, sin elegir página', async () => {
    const pedidos = abrirPublicaciones(administrativo)
    await screen.findByText('Trabajo p1')

    expect(screen.queryByRole('group', { name: 'Página' })).toBeNull()
    expect(pedidos()[0].get('delEstudio')).toBe('true')
  })

  it('los filtros piden por estado y por tipo', async () => {
    const pedidos = abrirPublicaciones(artista)
    await screen.findByText('Trabajo p1')

    fireEvent.click(screen.getByRole('button', { name: 'Borradores' }))
    fireEvent.click(screen.getByRole('button', { name: 'Blog' }))

    await waitFor(() => expect(pedidos().at(-1)?.get('tipo')).toBe('Blog'))
    expect(pedidos().at(-1)?.get('estado')).toBe('Borrador')
    expect(screen.getByRole('button', { name: 'Blog' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('cada fila muestra la portada, el título, el tipo, el estado, si está fijada y cuándo se modificó', async () => {
    abrirPublicaciones(artista, () =>
      pagina([publicacion('p1', { titulo: 'Rosa en el antebrazo', destacada: true, portadaFotoId: 'f1' })]),
    )

    await screen.findByText('Rosa en el antebrazo')

    screen.getByText('Trabajo · Borrador')
    screen.getByText('Fijada')
    // 13:30 en UTC son las 10:30 en Argentina (D-43).
    screen.getByText('Modificada el 17/11/2026 10:30')
    expect(document.querySelector('img')?.getAttribute('src')).toBe('/api/fotos/f1/miniatura')
  })

  it('sin publicaciones, lo dice', async () => {
    abrirPublicaciones(artista, () => pagina([]))

    await screen.findByText('No hay publicaciones para mostrar.')
  })

  it('Ver más trae la página siguiente, y desaparece cuando ya está todo', async () => {
    const pedidos = abrirPublicaciones(artista, (url) =>
      url.searchParams.get('pagina') === '2'
        ? pagina([publicacion('p3')], 3, 2)
        : pagina([publicacion('p1'), publicacion('p2')], 3),
    )
    await screen.findByText('Trabajo p2')

    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }))

    await screen.findByText('Trabajo p3')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(pedidos().at(-1)?.get('pagina')).toBe('2')
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull()
  })

  it('los botones para crear llevan a la página elegida', async () => {
    abrirPublicaciones(artista)
    await screen.findByText('Trabajo p1')

    expect(screen.getByRole('link', { name: 'Nuevo trabajo' }).getAttribute('href')).toBe(
      '/publicaciones/nueva?tipo=Trabajo',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Estudio' }))

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Nueva entrada de blog' }).getAttribute('href')).toBe(
        '/publicaciones/nueva?tipo=Blog&de=estudio',
      ),
    )
  })
})
