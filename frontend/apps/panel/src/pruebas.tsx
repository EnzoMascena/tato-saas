import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import App from './App'
import { crearClienteQuery } from './features/sesion/sesion'

/**
 * Simula la API para los tests: cada pedido «MÉTODO /ruta» responde lo que diga el test, y lo demás, 404. Lee las
 * rutas en cada pedido, así un test puede cambiar una respuesta a mitad de camino.
 */
export function simularApi(rutas: Record<string, () => Response>) {
  const fetchSimulado = vi.fn(async (url: string, opciones?: RequestInit) => {
    const respuesta = rutas[`${opciones?.method ?? 'GET'} ${new URL(url, 'https://localhost').pathname}`]
    return respuesta ? respuesta() : new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchSimulado)
  return fetchSimulado
}

export const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } })

/**
 * El panel entero, abierto en una ruta, con la API que simule el test.
 */
export function renderizarPanel(ruta: string) {
  const cliente = crearClienteQuery()

  render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return cliente
}
