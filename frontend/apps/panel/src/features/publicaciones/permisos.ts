import type { PublicacionDetalle, UsuarioActualRespuesta } from '@tato/api-client'

/**
 * Quién puede publicar u ocultar una publicación, según la página en la que está (D-51, doc 07, sección 5): en la de un
 * artista, solo ese artista, ni siquiera un Dueño; en la del estudio, un Dueño o un Administrativo. La API lo vuelve a
 * controlar: esto es para mostrar los botones solo a quien puede usarlos.
 */
export function puedePublicarOcultar(
  usuario: Pick<UsuarioActualRespuesta, 'roles' | 'tatuadorId'>,
  publicacion: Pick<PublicacionDetalle, 'tatuadorId'>,
) {
  if (publicacion.tatuadorId !== null) return publicacion.tatuadorId === usuario.tatuadorId

  return usuario.roles.includes('Duenio') || usuario.roles.includes('Administrativo')
}
