import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getObtenerPublicacionQueryKey, obtenerPublicacion, type PublicacionDetalle } from '@tato/api-client'

/**
 * La publicación que se está editando. No se vuelve a pedir sola: si otra persona la cambia mientras tanto, la versión
 * que tenemos tiene que seguir siendo la que abrimos, así el 409 avisa en lugar de pisar su cambio. Al salir de la
 * pantalla se descarta (gcTime), para que al volver traiga lo último.
 */
export function useDetallePublicacion(id: string | undefined) {
  return useQuery({
    queryKey: getObtenerPublicacionQueryKey(id ?? ''),
    queryFn: ({ signal }) => obtenerPublicacion(id!, { signal }),
    enabled: id !== undefined,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}

/**
 * Lee y cambia la publicación guardada en la caché. Cada cambio que acepta la API devuelve la versión nueva: se guarda
 * acá, y el siguiente pedido la usa para seguir editando sin recargar.
 */
export function useCacheDePublicacion(id: string) {
  const cliente = useQueryClient()
  const clave = getObtenerPublicacionQueryKey(id)

  return {
    actual: () => cliente.getQueryData<PublicacionDetalle>(clave)!,
    parchear: (cambios: (detalle: PublicacionDetalle) => Partial<PublicacionDetalle>) =>
      cliente.setQueryData<PublicacionDetalle>(clave, (detalle) => detalle && { ...detalle, ...cambios(detalle) }),
  }
}

export type CacheDePublicacion = ReturnType<typeof useCacheDePublicacion>
