import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { json, renderizarPanel, simularApi } from '@/pruebas'

const usuario = {
  id: 'u1',
  email: 'ink@ejemplo.com',
  nombre: 'Ink',
  estudioId: 'e1',
  roles: ['Duenio', 'Tatuador'],
  tatuadorId: 't1',
}

/**
 * La API sin sesión y con el login que diga el test. Cada token antiforgery es distinto, y si el login responde 204,
 * desde ahí hay sesión.
 */
function apiConLogin(login: () => Response) {
  let tokens = 0
  let entro = false

  return simularApi({
    'GET /api/auth/antiforgery': () => json({ token: `token-${++tokens}`, encabezado: 'X-XSRF-TOKEN' }),
    'GET /api/auth/yo': () => (entro ? json(usuario) : json({ status: 401 }, 401)),
    'POST /api/auth/login': () => {
      const respuesta = login()
      entro = respuesta.status === 204
      return respuesta
    },
  })
}

async function completarYEntrar(email: string, password: string) {
  fireEvent.change(await screen.findByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('inicio de sesión', () => {
  it('con 204 entra, y después pide un token antiforgery nuevo', async () => {
    const api = apiConLogin(() => new Response(null, { status: 204 }))
    renderizarPanel('/ingresar')

    await completarYEntrar('ink@ejemplo.com', 'una contraseña larga')

    await screen.findByRole('heading', { name: 'Publicaciones' })
    const login = api.mock.calls.find(([url]) => url === '/api/auth/login')!
    expect(new Headers(login[1]?.headers).get('X-XSRF-TOKEN')).toBe('token-1')
    expect(JSON.parse(login[1]?.body as string)).toEqual({ email: 'ink@ejemplo.com', password: 'una contraseña larga' })
    expect(api.mock.calls.filter(([url]) => url === '/api/auth/antiforgery')).toHaveLength(2)
  })

  it('con 401, avisa que el email o la contraseña no son correctos', async () => {
    apiConLogin(() => json({ status: 401 }, 401))
    renderizarPanel('/ingresar')

    await completarYEntrar('ink@ejemplo.com', 'otra contraseña')

    expect((await screen.findByRole('alert')).textContent).toBe('El email o la contraseña no son correctos.')
  })

  it('con 429, pide esperar un minuto', async () => {
    apiConLogin(() => new Response(null, { status: 429 }))
    renderizarPanel('/ingresar')

    await completarYEntrar('ink@ejemplo.com', 'otra contraseña')

    expect((await screen.findByRole('alert')).textContent).toBe('Hiciste muchos intentos. Esperá un minuto.')
  })

  it('sin un email válido ni contraseña, dice qué falta y no manda nada', async () => {
    const api = apiConLogin(() => new Response(null, { status: 204 }))
    renderizarPanel('/ingresar')

    await completarYEntrar('ink-arroba-ejemplo', '')

    await screen.findByText('Escribí un email válido.')
    screen.getByText('Escribí tu contraseña.')
    expect(api.mock.calls.some(([url]) => url === '/api/auth/login')).toBe(false)
  })
})
