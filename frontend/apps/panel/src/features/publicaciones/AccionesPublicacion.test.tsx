import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json } from '@/pruebas'
import { abrir, administrativo, artista, detalle, escribir, foto } from './pruebasPublicacion'

const duenioYArtista = { ...artista, roles: ['Duenio', 'Tatuador'] }
const lista = { fotos: [foto(1)], tieneConsentimiento: true }

const publicar = () => screen.getByRole('button', { name: /^(Publicar|Volver a publicar)$/ })

const cambios = (pedidos: ReturnType<typeof abrir>) => pedidos().filter((p) => p.metodo === 'POST')

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('consentimiento (RN-BLG-03)', () => {
  it('confirmarlo manda la versión, deja la casilla marcada y sin poder desmarcarse, y la versión nueva sigue', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle({ fotos: [foto(1)] })),
      'POST /api/publicaciones/p1/consentimiento': () => json({ version: 'v2' }),
      'POST /api/publicaciones/p1/publicar': () => json({ version: 'v3' }),
    })
    const casilla = (await screen.findByLabelText('El cliente aceptó que se publiquen las fotos')) as HTMLInputElement
    expect(casilla.checked).toBe(false)

    fireEvent.click(casilla)

    await waitFor(() => expect(casilla.checked).toBe(true))
    expect(casilla.disabled).toBe(true)
    screen.getByText(/Confirmado\. Queda registrado quién lo confirmó y cuándo/)
    expect(cambios(pedidos)[0].cuerpo).toEqual({ version: 'v1' })

    fireEvent.click(publicar())
    await screen.findByText('Mi página · Publicada')
    expect(cambios(pedidos)[1].cuerpo).toEqual({ version: 'v2' })
  })

  it('una publicación que ya lo tiene lo muestra confirmado', async () => {
    abrir('/publicaciones/p1', artista, { 'GET /api/publicaciones/p1': () => json(detalle(lista)) })

    const casilla = (await screen.findByLabelText('El cliente aceptó que se publiquen las fotos')) as HTMLInputElement

    expect(casilla.checked).toBe(true)
    expect(casilla.disabled).toBe(true)
  })

  it('si la API no deja confirmarlo (403), muestra el mensaje y no lo marca', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle()),
      'POST /api/publicaciones/p1/consentimiento': () =>
        json({ status: 403, detail: 'Solo el artista de esta página puede editar sus publicaciones.' }, 403),
    })
    const casilla = (await screen.findByLabelText('El cliente aceptó que se publiquen las fotos')) as HTMLInputElement

    fireEvent.click(casilla)

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Solo el artista de esta página puede editar sus publicaciones.',
    )
    expect(casilla.checked).toBe(false)
  })
})

describe('publicar y ocultar (RN-BLG-06)', () => {
  it('dice qué falta para publicar, y no deja hasta que está todo', async () => {
    abrir('/publicaciones/p1', artista, { 'GET /api/publicaciones/p1': () => json(detalle()) })
    await screen.findByText('Para publicar falta:')

    screen.getByText('Agregá al menos una foto.')
    screen.getByText('Confirmá que el cliente aceptó que se publiquen las fotos.')
    expect(publicar().hasAttribute('disabled')).toBe(true)
  })

  it('con una foto pero sin consentimiento, falta solo el consentimiento', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle({ fotos: [foto(1)] })),
    })
    await screen.findByText('Para publicar falta:')

    expect(screen.queryByText('Agregá al menos una foto.')).toBeNull()
    screen.getByText('Confirmá que el cliente aceptó que se publiquen las fotos.')
    expect(publicar().hasAttribute('disabled')).toBe(true)
  })

  it('con foto y consentimiento publica, y después se puede ocultar sin borrar', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle(lista)),
      'POST /api/publicaciones/p1/publicar': () => json({ version: 'v2' }),
      'POST /api/publicaciones/p1/ocultar': () => json({ version: 'v3' }),
    })
    await screen.findByRole('heading', { name: 'Publicar' })
    expect(screen.queryByText('Para publicar falta:')).toBeNull()

    fireEvent.click(publicar())

    await screen.findByText('Mi página · Publicada')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar' }))
    await screen.findByText('Mi página · Oculta')

    expect(cambios(pedidos).map((p) => [p.ruta, p.cuerpo.version])).toEqual([
      ['/api/publicaciones/p1/publicar', 'v1'],
      ['/api/publicaciones/p1/ocultar', 'v2'],
    ])
    // Ocultar no borra: la publicación sigue, con sus fotos, y se puede volver a publicar.
    screen.getByRole('heading', { name: 'Fotos (1)' })
    screen.getByRole('button', { name: 'Volver a publicar' })
  })

  it('con cambios sin guardar, pide guardar antes de publicar', async () => {
    abrir('/publicaciones/p1', artista, { 'GET /api/publicaciones/p1': () => json(detalle(lista)) })
    await screen.findByRole('heading', { name: 'Publicar' })
    expect(publicar().hasAttribute('disabled')).toBe(false)

    escribir('Título', 'Otro título')

    await screen.findByText('Guardá los cambios antes de publicar.')
    expect(publicar().hasAttribute('disabled')).toBe(true)
  })

  it('si una regla no lo deja publicar (422), muestra el mensaje de la API', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle(lista)),
      'POST /api/publicaciones/p1/publicar': () =>
        json({ status: 422, detail: 'Falta el consentimiento del cliente.', regla: 'RN-BLG-03' }, 422),
    })
    await screen.findByRole('heading', { name: 'Publicar' })

    fireEvent.click(publicar())

    expect((await screen.findByRole('alert')).textContent).toBe('Falta el consentimiento del cliente.')
    screen.getByText('Mi página · Borrador')
  })
})

describe('los botones según el rol y la página (D-51)', () => {
  it('el artista ve Publicar en su página', async () => {
    abrir('/publicaciones/p1', artista, { 'GET /api/publicaciones/p1': () => json(detalle(lista)) })

    await screen.findByRole('button', { name: 'Publicar' })
  })

  it('un Tatuador no puede publicar en la página del estudio, y ve por qué', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle({ ...lista, tatuadorId: null })),
    })

    await screen.findByText('Solo un Dueño o un Administrativo puede publicar u ocultar las publicaciones del estudio.')
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })

  it('un Dueño o un Administrativo puede publicar en la página del estudio', async () => {
    abrir('/publicaciones/p1', duenioYArtista, {
      'GET /api/publicaciones/p1': () => json(detalle({ ...lista, tatuadorId: null })),
    })
    await screen.findByRole('button', { name: 'Publicar' })
    cleanup()

    abrir('/publicaciones/p1', administrativo, {
      'GET /api/publicaciones/p1': () => json(detalle({ ...lista, tatuadorId: null })),
    })
    await screen.findByRole('button', { name: 'Publicar' })
  })

  it('ni un Dueño publica ni oculta en la página de otro artista', async () => {
    abrir('/publicaciones/p1', { ...duenioYArtista, tatuadorId: 't-otra' }, {
      'GET /api/publicaciones/p1': () => json(detalle({ ...lista, estado: 'Publicada' })),
    })

    await screen.findByText('Solo el artista de esta página puede publicar u ocultar sus publicaciones.')
    expect(screen.queryByRole('button', { name: 'Ocultar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  })
})
