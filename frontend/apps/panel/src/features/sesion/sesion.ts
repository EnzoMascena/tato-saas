import { MutationCache, QueryCache, QueryClient, useQuery } from '@tanstack/react-query'
import {
  ErrorApi,
  obtenerAntiforgery,
  obtenerUsuarioActual,
  usarAntiforgery,
  type UsuarioActualRespuesta,
} from '@tato/api-client'

export const claveSesion = ['sesion']

/**
 * La sesión: primero un token antiforgery nuevo y después quién es la persona, o null si no hay sesión. Se vuelve a
 * pedir después de iniciar o cerrar sesión, porque el token anterior deja de servir.
 */
async function pedirSesion(): Promise<UsuarioActualRespuesta | null> {
  usarAntiforgery(await obtenerAntiforgery())

  try {
    return await obtenerUsuarioActual()
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 401) return null
    throw error
  }
}

/**
 * Quién tiene la sesión. No se vuelve a pedir sola: la invalidan el login, el logout y cualquier 401.
 */
export function useSesion() {
  return useQuery({ queryKey: claveSesion, queryFn: pedirSesion, staleTime: Infinity })
}

/**
 * El cliente de TanStack Query del panel. Ante un 401 en cualquier pedido vuelve a pedir la sesión: sin sesión, las
 * rutas protegidas llevan al inicio de sesión, y el token nuevo sirve para volver a entrar.
 */
export function crearClienteQuery() {
  const cliente: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: siPerdioLaSesion }),
    mutationCache: new MutationCache({ onError: siPerdioLaSesion }),
    defaultOptions: {
      queries: {
        // Un error de la API (4xx) no se arregla reintentando; uno de la red o del servidor, quizás sí.
        retry: (fallos, error) => fallos < 3 && !(error instanceof ErrorApi && error.status < 500),
      },
    },
  })

  function siPerdioLaSesion(error: Error) {
    if (error instanceof ErrorApi && error.status === 401) void cliente.invalidateQueries({ queryKey: claveSesion })
  }

  return cliente
}
