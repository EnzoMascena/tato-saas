// Baja el OpenAPI de la API levantada con --launch-profile https y lo guarda en openapi.json, que se versiona: así
// generar el cliente no necesita la API, y los cambios del contrato se ven en cada PR.
// Corre con node --use-system-ca, para que Node confíe en el certificado de desarrollo de .NET.
import { writeFile } from 'node:fs/promises'

const url = 'https://localhost:7239/openapi/v1.json'
const respuesta = await fetch(url).catch((error) => {
  throw new Error(`No pude bajar ${url}: ¿está levantada la API con --launch-profile https?`, { cause: error })
})

if (!respuesta.ok) throw new Error(`${url} respondió ${respuesta.status}`)

await writeFile(new URL('../openapi.json', import.meta.url), await respuesta.text())
console.log('openapi.json actualizado')
