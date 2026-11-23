import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json } from '@/pruebas'
import { abrir, administrativo, artista, detalle, escribir } from './pruebasPublicacion'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('crear una publicación', () => {
  it('crea con el tipo y la página elegidos, conserva los saltos de línea y pasa a la pantalla de edición', async () => {
    const pedidos = abrir('/publicaciones/nueva?tipo=Blog&de=estudio', artista, {
      'POST /api/publicaciones': () => json({ id: 'nueva1' }, 201),
      'GET /api/publicaciones/nueva1': () => json(detalle({ id: 'nueva1', tipo: 'Blog', tatuadorId: null })),
    })
    await screen.findByRole('heading', { name: 'Nueva entrada de blog' })

    escribir('Título', 'Mi viaje a Bolivia')
    escribir('Texto', 'Salimos de noche.\n\nLlegamos de día.')
    fireEvent.click(screen.getByLabelText(/Fijada/))
    fireEvent.click(screen.getByRole('button', { name: 'Crear publicación' }))

    await screen.findByRole('heading', { name: 'Editar entrada de blog' })
    expect(pedidos().find((p) => p.metodo === 'POST')?.cuerpo).toEqual({
      titulo: 'Mi viaje a Bolivia',
      descripcion: 'Salimos de noche.\n\nLlegamos de día.',
      fechaTrabajo: null,
      estiloId: null,
      zonaCuerpoId: null,
      tatuadorId: null,
      destacada: true,
      tipo: 'Blog',
    })
  })

  it('un artista crea por defecto en su página, y puede cambiarla por la del estudio', async () => {
    const pedidos = abrir('/publicaciones/nueva', artista, {
      'POST /api/publicaciones': () => json({ id: 'nueva1' }, 201),
      'GET /api/publicaciones/nueva1': () => json(detalle({ id: 'nueva1' })),
    })
    await screen.findByRole('heading', { name: 'Nuevo trabajo' })

    escribir('Título', 'Mi trabajo')
    fireEvent.click(screen.getByRole('button', { name: 'Crear publicación' }))
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    expect(pedidos().find((p) => p.metodo === 'POST')?.cuerpo.tatuadorId).toBe('t1')
  })

  it('quien no es artista ve solo la página del estudio, sin elegir', async () => {
    const pedidos = abrir('/publicaciones/nueva', administrativo, {
      'POST /api/publicaciones': () => json({ id: 'nueva1' }, 201),
      'GET /api/publicaciones/nueva1': () => json(detalle({ id: 'nueva1', tatuadorId: null })),
    })
    await screen.findByRole('heading', { name: 'Nuevo trabajo' })
    expect(screen.queryByRole('group', { name: 'Página' })).toBeNull()

    escribir('Título', 'Del estudio')
    fireEvent.click(screen.getByRole('button', { name: 'Crear publicación' }))
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    expect(pedidos().find((p) => p.metodo === 'POST')?.cuerpo.tatuadorId).toBeNull()
  })
})

describe('el formulario', () => {
  it('sin título, dice qué falta y no manda nada', async () => {
    const pedidos = abrir('/publicaciones/nueva', artista)
    await screen.findByRole('heading', { name: 'Nuevo trabajo' })

    fireEvent.click(screen.getByRole('button', { name: 'Crear publicación' }))

    await screen.findByText('Escribí un título.')
    expect(pedidos()).toHaveLength(0)
  })

  it('cuenta los caracteres del texto, y con más de 2200 no deja guardar', async () => {
    const pedidos = abrir('/publicaciones/nueva', artista)
    await screen.findByRole('heading', { name: 'Nuevo trabajo' })
    screen.getByText('0 / 2200')

    escribir('Texto', 'Hola, mundo')
    screen.getByText('11 / 2200')

    escribir('Título', 'Un título')
    escribir('Texto', 'a'.repeat(2201))
    screen.getByText('2201 / 2200')
    fireEvent.click(screen.getByRole('button', { name: 'Crear publicación' }))

    await screen.findByText('El texto no puede pasar de 2200 caracteres.')
    expect(pedidos()).toHaveLength(0)
  })

  it('un título de más de 120 caracteres no pasa', async () => {
    abrir('/publicaciones/nueva', artista)
    await screen.findByRole('heading', { name: 'Nuevo trabajo' })

    escribir('Título', 'a'.repeat(121))
    fireEvent.click(screen.getByRole('button', { name: 'Crear publicación' }))

    await screen.findByText('El título no puede pasar de 120 caracteres.')
  })
})

describe('editar una publicación', () => {
  it('muestra lo guardado, y el PUT manda también lo que la pantalla no muestra, con su versión', async () => {
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle()),
      'PUT /api/publicaciones/p1': () => json({ version: 'v2' }),
    })
    await screen.findByRole('heading', { name: 'Editar trabajo' })
    expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Rosa en el antebrazo')
    expect((screen.getByLabelText('Texto') as HTMLTextAreaElement).value).toBe('Primera línea\nsegunda línea')
    screen.getByText('Mi página · Borrador')

    escribir('Título', 'Rosa en el brazo')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(pedidos().some((p) => p.metodo === 'PUT')).toBe(true))
    expect(pedidos().find((p) => p.metodo === 'PUT')?.cuerpo).toEqual({
      titulo: 'Rosa en el brazo',
      descripcion: 'Primera línea\nsegunda línea',
      fechaTrabajo: '2026-10-01',
      estiloId: 'estilo1',
      zonaCuerpoId: 'zona1',
      tatuadorId: 't1',
      destacada: false,
      tipo: 'Trabajo',
      version: 'v1',
    })
  })

  it('guarda la versión que devuelve la API y la usa en el cambio siguiente, sin recargar', async () => {
    let version = 1
    const pedidos = abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle()),
      'PUT /api/publicaciones/p1': () => json({ version: `v${++version}` }),
    })
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    for (const titulo of ['Primer cambio', 'Segundo cambio']) {
      escribir('Título', titulo)
      fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar cambios' }).hasAttribute('disabled')).toBe(false))
    }

    const versiones = pedidos().filter((p) => p.metodo === 'PUT').map((p) => p.cuerpo.version)
    expect(versiones).toEqual(['v1', 'v2'])
    expect(pedidos().filter((p) => p.metodo === 'GET')).toHaveLength(1)
  })

  it('si alguien la cambió (409), avisa con Recargar, y Recargar trae lo nuevo sin pisarlo', async () => {
    let recargada = false
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () =>
        json(recargada ? detalle({ titulo: 'Título del otro artista', version: 'v9' }) : detalle()),
      'PUT /api/publicaciones/p1': () => json({ status: 409, detail: 'La modificó otra persona.' }, 409),
    })
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    escribir('Título', 'Mi cambio')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    const aviso = await screen.findByRole('alert')
    expect(aviso.textContent).toContain('Alguien cambió esta publicación mientras la editabas.')
    recargada = true
    fireEvent.click(screen.getByRole('button', { name: 'Recargar' }))

    await waitFor(() => expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Título del otro artista'))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('si no tiene permiso (403), muestra el mensaje de la API', async () => {
    abrir('/publicaciones/p1', artista, {
      'GET /api/publicaciones/p1': () => json(detalle({ tatuadorId: null })),
      'PUT /api/publicaciones/p1': () =>
        json({ status: 403, detail: 'Solo podés editar las publicaciones del estudio que creaste vos.' }, 403),
    })
    await screen.findByRole('heading', { name: 'Editar trabajo' })

    escribir('Título', 'Otro título')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Solo podés editar las publicaciones del estudio que creaste vos.',
    )
  })
})
