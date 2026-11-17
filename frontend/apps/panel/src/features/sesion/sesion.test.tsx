import { pedirApi } from '@tato/api-client'
import { act, cleanup, screen } from '@testing-library/react'
import { afterEach, describe, it, vi } from 'vitest'
import { json, renderizarPanel, simularApi } from '@/pruebas'

const antiforgery = () => json({ token: 'token', encabezado: 'X-XSRF-TOKEN' })
const sinSesion = () => json({ status: 401 }, 401)
const usuario = () =>
  json({ id: 'u1', email: 'ink@ejemplo.com', nombre: 'Ink', estudioId: 'e1', roles: ['Duenio'], tatuadorId: null })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('sesión y rutas', () => {
  it('sin sesión, lleva al inicio de sesión', async () => {
    simularApi({ 'GET /api/auth/antiforgery': antiforgery, 'GET /api/auth/yo': sinSesion })

    renderizarPanel('/publicaciones')

    await screen.findByRole('heading', { name: 'Iniciar sesión' })
  })

  it('con sesión, muestra la página pedida', async () => {
    simularApi({ 'GET /api/auth/antiforgery': antiforgery, 'GET /api/auth/yo': usuario })

    renderizarPanel('/mi-pagina')

    await screen.findByRole('heading', { name: 'Mi página' })
  })

  it('ante un 401 en cualquier pedido, lleva al inicio de sesión', async () => {
    const rutas: Record<string, () => Response> = { 'GET /api/auth/antiforgery': antiforgery, 'GET /api/auth/yo': usuario }
    simularApi(rutas)
    const cliente = renderizarPanel('/publicaciones')
    await screen.findByRole('heading', { name: 'Publicaciones' })

    // La sesión venció: desde ahora, yo y cualquier otro pedido responden 401.
    rutas['GET /api/auth/yo'] = sinSesion
    rutas['GET /api/publicaciones'] = sinSesion
    await act(() =>
      cliente
        .fetchQuery({ queryKey: ['publicaciones'], queryFn: () => pedirApi('/api/publicaciones') })
        .catch(() => undefined),
    )

    await screen.findByRole('heading', { name: 'Iniciar sesión' })
  })
})
