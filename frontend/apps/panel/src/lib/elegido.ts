/**
 * El valor de un parámetro de la URL, si es uno de los válidos.
 */
export function elegido<T extends string>(valor: string | null, validos: readonly T[]) {
  return validos.find((valido) => valido === valor)
}
