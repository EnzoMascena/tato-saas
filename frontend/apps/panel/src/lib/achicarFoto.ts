// La API guarda como máximo 2048 px de lado (Fotos:LadoDetalle): una foto más grande solo gasta datos móviles al subirla.
const LADO_MAXIMO = 2048

// Una foto que ya mide menos que eso y pesa poco se sube tal cual: volver a comprimirla le saca calidad sin ganar nada.
const BYTES_QUE_NO_VALE_ACHICAR = 1.5 * 1024 * 1024

const CALIDAD_JPEG = 0.85

// Los formatos que el navegador sabe leer y la API acepta (JPEG, PNG y WebP).
const FORMATOS = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Achica la foto a 2048 px de lado, en JPEG, antes de subirla: una foto de 4 MB queda en alrededor de medio MB. Si no
 * puede (un formato que el navegador no lee, como las HEIC de algunos Android, o un navegador sin OffscreenCanvas), la
 * devuelve como estaba: la API la acepta o la rechaza con su mensaje. Nunca falla, porque achicar es una ayuda.
 */
export async function achicarFoto(archivo: File): Promise<File> {
  if (!FORMATOS.includes(archivo.type)) return archivo

  try {
    // from-image: respeta la orientación con la que el celular sacó la foto.
    const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
    const lado = Math.max(imagen.width, imagen.height)

    if (lado <= LADO_MAXIMO && archivo.size <= BYTES_QUE_NO_VALE_ACHICAR) {
      imagen.close()
      return archivo
    }

    const escala = Math.min(1, LADO_MAXIMO / lado)
    const ancho = Math.round(imagen.width * escala)
    const alto = Math.round(imagen.height * escala)

    const lienzo = new OffscreenCanvas(ancho, alto)
    const contexto = lienzo.getContext('2d')!
    // Sin fondo, lo transparente de un PNG queda negro al pasar a JPEG.
    contexto.fillStyle = '#fff'
    contexto.fillRect(0, 0, ancho, alto)
    contexto.drawImage(imagen, 0, 0, ancho, alto)
    imagen.close()

    const achicada = await lienzo.convertToBlob({ type: 'image/jpeg', quality: CALIDAD_JPEG })

    // Si no ganó nada (una foto chica y ya muy comprimida), se sube la original.
    if (achicada.size >= archivo.size) return archivo

    return new File([achicada], `${archivo.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
  } catch {
    return archivo
  }
}
