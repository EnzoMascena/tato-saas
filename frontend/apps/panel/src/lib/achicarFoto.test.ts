import { afterEach, describe, expect, it, vi } from 'vitest'
import { achicarFoto } from './achicarFoto'

const foto = (nombre: string, tipo: string, bytes: number) =>
  new File([new Uint8Array(bytes)], nombre, { type: tipo })

const MB = 1024 * 1024

/**
 * Un navegador de mentira: createImageBitmap devuelve una imagen de ese tamaño, y el lienzo recuerda con qué medidas se
 * creó y devuelve un JPEG del peso que diga el test.
 */
function navegadorCon(imagen: { width: number; height: number }, pesoDelJpeg = 300 * 1024) {
  const medidas: number[][] = []
  const cerrada = vi.fn()

  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ ...imagen, close: cerrada })))
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(ancho: number, alto: number) {
        medidas.push([ancho, alto])
      }
      getContext = () => ({ fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' })
      convertToBlob = async () => new Blob([new Uint8Array(pesoDelJpeg)], { type: 'image/jpeg' })
    },
  )

  return { medidas, cerrada }
}

afterEach(() => vi.unstubAllGlobals())

describe('achicarFoto', () => {
  it('una foto grande queda en 2048 px de lado, en JPEG, y más liviana', async () => {
    const { medidas } = navegadorCon({ width: 4000, height: 3000 })
    const original = foto('IMG_0001.HEIC.png', 'image/png', 4 * MB)

    const achicada = await achicarFoto(original)

    expect(medidas).toEqual([[2048, 1536]])
    expect(achicada.type).toBe('image/jpeg')
    expect(achicada.name).toBe('IMG_0001.HEIC.jpg')
    expect(achicada.size).toBeLessThan(original.size)
  })

  it('una foto vertical se achica por su lado largo', async () => {
    const { medidas } = navegadorCon({ width: 3000, height: 4000 })

    await achicarFoto(foto('vertical.jpg', 'image/jpeg', 4 * MB))

    expect(medidas).toEqual([[1536, 2048]])
  })

  it('una foto que ya es chica y liviana se sube como estaba', async () => {
    const { medidas, cerrada } = navegadorCon({ width: 1600, height: 1200 })
    const original = foto('chica.jpg', 'image/jpeg', 400 * 1024)

    expect(await achicarFoto(original)).toBe(original)
    expect(medidas).toHaveLength(0)
    expect(cerrada).toHaveBeenCalled()
  })

  it('un formato que el navegador no lee, como HEIC, se sube como estaba', async () => {
    const { medidas } = navegadorCon({ width: 4000, height: 3000 })
    const original = foto('IMG_0002.heic', 'image/heic', 3 * MB)

    expect(await achicarFoto(original)).toBe(original)
    expect(medidas).toHaveLength(0)
  })

  it('si el navegador no puede leerla, se sube como estaba', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('No se pudo decodificar')))
    const original = foto('rota.jpg', 'image/jpeg', 3 * MB)

    expect(await achicarFoto(original)).toBe(original)
  })

  it('si al achicarla no gana nada, se sube la original', async () => {
    navegadorCon({ width: 4000, height: 3000 }, 5 * MB)
    const original = foto('ya-comprimida.jpg', 'image/jpeg', 2 * MB)

    expect(await achicarFoto(original)).toBe(original)
  })
})
