import { fireEvent, screen } from '@testing-library/react'
import { json, renderizarPanel, simularApi } from '@/pruebas'

export const antiforgery = () => json({ token: 'token', encabezado: 'X-XSRF-TOKEN' })

export const artista = {
  id: 'u1',
  email: 'ink@ejemplo.com',
  nombre: 'Ink',
  estudioId: 'e1',
  roles: ['Tatuador'],
  tatuadorId: 't1',
}
export const administrativo = { ...artista, roles: ['Administrativo'], tatuadorId: null }

export const foto = (n: number) => ({ id: `f${n}`, orden: n, ancho: 1200, alto: 1600 })

export const detalle = (cambios: object = {}) => ({
  id: 'p1',
  titulo: 'Rosa en el antebrazo',
  tipo: 'Trabajo',
  descripcion: 'Primera línea\nsegunda línea',
  fechaTrabajo: '2026-10-01',
  estiloId: 'estilo1',
  zonaCuerpoId: 'zona1',
  tatuadorId: 't1',
  destacada: false,
  estado: 'Borrador',
  tieneConsentimiento: false,
  publicadaEn: null,
  actualizadaEn: '2026-11-17T13:30:00+00:00',
  version: 'v1',
  fotos: [],
  ...cambios,
})

/**
 * El panel abierto en una ruta, con sesión de esa persona y las respuestas que diga el test. Devuelve los pedidos que
 * se hicieron a /api/publicaciones, con su método y su cuerpo: el JSON ya leído, o el FormData de una foto.
 */
export function abrir(
  ruta: string,
  usuario: object,
  rutas: Record<string, (url: URL) => Response | Promise<Response>> = {},
) {
  const api = simularApi({
    'GET /api/auth/antiforgery': antiforgery,
    'GET /api/auth/yo': () => json(usuario),
    ...rutas,
  })
  renderizarPanel(ruta)

  return () =>
    api.mock.calls
      .filter(([url]) => url.startsWith('/api/publicaciones'))
      .map(([url, opciones]) => ({
        metodo: opciones?.method ?? 'GET',
        ruta: url,
        cuerpo: typeof opciones?.body === 'string' ? JSON.parse(opciones.body) : opciones?.body,
      }))
}

export const escribir = (etiqueta: string | RegExp, valor: string) =>
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
