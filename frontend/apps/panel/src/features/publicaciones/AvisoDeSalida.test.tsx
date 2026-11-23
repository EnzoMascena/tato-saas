import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json } from '@/pruebas'
import { abrir, artista, detalle, escribir, foto } from './pruebasPublicacion'

const lista = () => json({ items: [], numeroPagina: 1, tamanioPagina: 20, total: 0 })

const rutasDeEdicion = {
  'GET /api/publicaciones/p1': () => json(detalle()),
  'GET /api/publicaciones': lista,
}

const volver = () => screen.getByRole('link', { name: 'Volver a las publicaciones' })

const estaEnLaLista = () => screen.findByRole('heading', { name: 'Publicaciones' })

const AVISO = 'Tenés cambios sin guardar. Si salís, se pierden.'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('cambios sin guardar', () => {
  it('con cambios, al irse pregunta, y Seguir editando conserva lo escrito', async () => {
    abrir('/publicaciones/p1', artista, rutasDeEdicion)
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    escribir('Título', 'Un cambio sin guardar')
    fireEvent.click(volver())

    expect((await screen.findByRole('alert')).textContent).toContain(AVISO)
    screen.getByRole('heading', { name: 'Editar trabajo' })

    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }))

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Un cambio sin guardar')
  })

  it('Salir sin guardar deja irse', async () => {
    abrir('/publicaciones/p1', artista, rutasDeEdicion)
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    escribir('Título', 'Un cambio sin guardar')
    fireEvent.click(volver())
    fireEvent.click(await screen.findByRole('button', { name: 'Salir sin guardar' }))

    await estaEnLaLista()
  })

  it('también pregunta al tocar la barra de abajo', async () => {
    abrir('/publicaciones/p1', artista, rutasDeEdicion)
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    escribir('Texto', 'Otro texto')
    fireEvent.click(screen.getByRole('link', { name: 'Mi página' }))

    expect((await screen.findByRole('alert')).textContent).toContain(AVISO)
  })

  it('sin cambios, se va directo', async () => {
    abrir('/publicaciones/p1', artista, rutasDeEdicion)
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    fireEvent.click(volver())

    await estaEnLaLista()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('después de guardar ya no pregunta', async () => {
    abrir('/publicaciones/p1', artista, { ...rutasDeEdicion, 'PUT /api/publicaciones/p1': () => json({ version: 'v2' }) })
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    escribir('Título', 'Un cambio que sí guardo')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar cambios' }).hasAttribute('disabled')).toBe(false))
    fireEvent.click(volver())

    await estaEnLaLista()
  })

  it('mientras sube fotos, avisa que irse las corta', async () => {
    let terminar!: () => void
    const demorada = new Promise<Response>((resolver) => {
      terminar = () => resolver(json({ foto: foto(1), version: 'v2' }, 201))
    })
    abrir('/publicaciones/p1', artista, { ...rutasDeEdicion, 'POST /api/publicaciones/p1/fotos': () => demorada })
    await screen.findByRole('heading', { name: 'Fotos (0)' })

    fireEvent.change(screen.getByLabelText('Elegir fotos'), {
      target: { files: [new File(['contenido'], 'a.jpg', { type: 'image/jpeg' })] },
    })
    await screen.findByText('Subiendo 1 de 1')
    fireEvent.click(volver())

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Todavía se están guardando cambios o subiendo fotos. Si salís ahora, se cortan.',
    )
    terminar()
    await screen.findByRole('heading', { name: 'Fotos (1)' })
  })

  it('al crear, pasa a la pantalla de edición sin preguntar', async () => {
    abrir('/publicaciones/nueva', artista, {
      'POST /api/publicaciones': () => json({ id: 'nueva1' }, 201),
      'GET /api/publicaciones/nueva1': () => json(detalle({ id: 'nueva1' })),
    })
    await screen.findByRole('heading', { name: 'Nuevo trabajo' })

    escribir('Título', 'Mi trabajo')
    fireEvent.click(screen.getByRole('button', { name: 'Crear publicación' }))

    await screen.findByRole('heading', { name: 'Editar trabajo' })
    expect(screen.queryByText(AVISO)).toBeNull()
  })

  it('una publicación nueva con algo escrito también pregunta al irse', async () => {
    abrir('/publicaciones/nueva', artista, { 'GET /api/publicaciones': lista })
    await screen.findByRole('heading', { name: 'Nuevo trabajo' })

    escribir('Título', 'Todavía sin crear')
    fireEvent.click(volver())

    expect((await screen.findByRole('alert')).textContent).toContain(AVISO)
  })

  it('al cerrar o recargar la pestaña, el navegador avisa solo si hay cambios', async () => {
    abrir('/publicaciones/p1', artista, rutasDeEdicion)
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    const sinCambios = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(sinCambios)
    expect(sinCambios.defaultPrevented).toBe(false)

    escribir('Título', 'Un cambio sin guardar')
    await waitFor(() => {
      const conCambios = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(conCambios)
      expect(conCambios.defaultPrevented).toBe(true)
    })
  })
})
