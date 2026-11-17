/**
 * El token antiforgery y el encabezado en el que va, tal como los devuelve GET /api/auth/antiforgery.
 */
export interface Antiforgery {
  token: string
  encabezado: string
}

let antiforgery: Antiforgery | undefined

/**
 * Guarda el token que va en cada POST, PUT, PATCH y DELETE. Se pide al cargar el panel y otra vez después de iniciar o
 * cerrar sesión, porque el anterior deja de servir.
 */
export function usarAntiforgery(valor: Antiforgery | undefined) {
  antiforgery = valor
}

/**
 * Un error de la API, con lo que trae su ProblemDetails. A la persona se le muestra el detail.
 */
export class ErrorApi extends Error {
  readonly status: number
  readonly detail: string
  /** El código de la regla de negocio de un 422, por ejemplo «RN-BLG-03». */
  readonly regla?: string

  constructor(status: number, detail: string, regla?: string) {
    super(detail)
    this.name = 'ErrorApi'
    this.status = status
    this.detail = detail
    this.regla = regla
  }
}

/**
 * Orval tipa con esto el error de cada hook: lo que llega es siempre un ErrorApi, no el ProblemDetails crudo.
 */
export type ErrorType<_ProblemDetails> = ErrorApi

const modificanDatos = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * El fetch de todos los pedidos a la API: es el que usa el cliente que genera Orval. Siempre al mismo origen (/api),
 * así el navegador manda la cookie de sesión, que el front nunca toca.
 */
export async function pedirApi<T>(url: string, opciones: RequestInit = {}): Promise<T> {
  const encabezados = new Headers(opciones.headers)

  if (antiforgery && modificanDatos.has((opciones.method ?? 'GET').toUpperCase()))
    encabezados.set(antiforgery.encabezado, antiforgery.token)

  const respuesta = await fetch(url, { ...opciones, headers: encabezados, credentials: 'same-origin' }).catch(
    (error: unknown) => {
      // Si lo canceló TanStack Query, sigue como cancelación.
      if (opciones.signal?.aborted) throw error
      throw new ErrorApi(0, 'No hay conexión con el servidor. Probá de nuevo en un momento.')
    },
  )

  if (!respuesta.ok) throw await errorDe(respuesta)

  if (respuesta.status === 204) return undefined as T

  // Las fotos llegan en WebP, no en JSON.
  return (respuesta.headers.get('content-type')?.includes('json') ? respuesta.json() : respuesta.blob()) as Promise<T>
}

async function errorDe(respuesta: Response) {
  // Un error del proxy, como un 502, no trae ProblemDetails.
  const problema: { detail?: string; regla?: string } | undefined = await respuesta.json().catch(() => undefined)

  return new ErrorApi(
    respuesta.status,
    problema?.detail ?? 'Algo salió mal. Probá de nuevo en un momento.',
    problema?.regla,
  )
}
