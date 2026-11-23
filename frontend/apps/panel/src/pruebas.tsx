import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { vi } from 'vitest'
import { rutas } from './App'
import { crearClienteQuery } from './features/sesion/sesion'

/**
 * Simula la API para los tests: cada pedido «MÉTODO /ruta» responde lo que diga el test, y lo demás, 404. La respuesta
 * recibe la URL, por los parámetros. Lee las rutas en cada pedido, así un test puede cambiar una a mitad de camino.
 */
export function simularApi(rutas: Record<string, (url: URL) => Response>) {
  const fetchSimulado = vi.fn(async (url: string, opciones?: RequestInit) => {
    const pedida = new URL(url, 'https://localhost')
    const respuesta = rutas[`${opciones?.method ?? 'GET'} ${pedida.pathname}`]
    return respuesta ? respuesta(pedida) : new Response(null, { status: 404 })
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
      <RouterProvider router={createMemoryRouter(rutas, { initialEntries: [ruta] })} />
    </QueryClientProvider>,
  )

  return cliente
}
