import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorApi, pedirApi, usarAntiforgery } from './pedirApi'

const json = (cuerpo: object, status = 200, tipo = 'application/json') =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': tipo } })

function simularApi(respuesta: () => Response) {
  const fetchSimulado = vi.fn(async (_url: string, _opciones: RequestInit) => respuesta())
  vi.stubGlobal('fetch', fetchSimulado)
  return fetchSimulado
}

function tokenEnviado(fetchSimulado: ReturnType<typeof simularApi>, pedido: number) {
  return new Headers(fetchSimulado.mock.calls[pedido][1].headers).get('X-XSRF-TOKEN')
}

afterEach(() => {
  vi.unstubAllGlobals()
  usarAntiforgery(undefined)
})

describe('pedirApi', () => {
  it('manda el token en POST, PUT, PATCH y DELETE, no en GET, y con las cookies del mismo origen', async () => {
    const fetchSimulado = simularApi(() => json({}))
    usarAntiforgery({ token: 'token', encabezado: 'X-XSRF-TOKEN' })

    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'GET']) await pedirApi('/api/publicaciones', { method })

    expect([0, 1, 2, 3, 4].map((pedido) => tokenEnviado(fetchSimulado, pedido))).toEqual([
      'token',
      'token',
      'token',
      'token',
      null,
    ])
    expect(fetchSimulado.mock.calls[0][1].credentials).toBe('same-origin')
  })

  it('después de cambiar el token, el pedido siguiente usa el nuevo', async () => {
    const fetchSimulado = simularApi(() => json({}))

    usarAntiforgery({ token: 'antes-de-entrar', encabezado: 'X-XSRF-TOKEN' })
    await pedirApi('/api/auth/login', { method: 'POST' })
    usarAntiforgery({ token: 'despues-de-entrar', encabezado: 'X-XSRF-TOKEN' })
    await pedirApi('/api/publicaciones', { method: 'POST' })

    expect(tokenEnviado(fetchSimulado, 1)).toBe('despues-de-entrar')
  })

  it('un 422 da un ErrorApi con el status, el detail y la regla', async () => {
    simularApi(() =>
      json({ status: 422, detail: 'Falta el consentimiento.', regla: 'RN-BLG-03' }, 422, 'application/problem+json'),
    )

    const error = await pedirApi('/api/publicaciones/1/publicar', { method: 'POST' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({ status: 422, detail: 'Falta el consentimiento.', regla: 'RN-BLG-03' })
  })

  it('un error sin JSON, como un 502, también da un ErrorApi', async () => {
    simularApi(() => new Response('Bad Gateway', { status: 502 }))

    await expect(pedirApi('/api/publicaciones')).rejects.toMatchObject({
      status: 502,
      detail: 'Algo salió mal. Probá de nuevo en un momento.',
    })
  })

  it('un 204 devuelve undefined', async () => {
    simularApi(() => new Response(null, { status: 204 }))

    await expect(pedirApi('/api/auth/login', { method: 'POST' })).resolves.toBeUndefined()
  })
})
