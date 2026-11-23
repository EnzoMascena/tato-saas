import { ErrorApi } from '@tato/api-client'
import { useState } from 'react'
import type { Aviso } from './AvisoDeError'

/**
 * El aviso de la última acción que falló. intentar corre una acción de la API: si responde con un error, lo deja en el
 * aviso (un 409 como conflicto; el resto con el mensaje de la API) y devuelve undefined. Lo que no es un error de la API
 * es un bug y sigue de largo.
 */
export function useAvisos() {
  const [aviso, setAviso] = useState<Aviso>()

  function avisar(error: ErrorApi) {
    setAviso(error.status === 409 ? { tipo: 'conflicto' } : { tipo: 'error', mensaje: error.detail })
  }

  async function intentar<T>(accion: () => Promise<T>): Promise<T | undefined> {
    setAviso(undefined)

    try {
      return await accion()
    } catch (error) {
      if (!(error instanceof ErrorApi)) throw error
      avisar(error)
      return undefined
    }
  }

  return { aviso, avisar, intentar, limpiar: () => setAviso(undefined) }
}
