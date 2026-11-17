import { defineConfig } from 'orval'

// Genera desde la copia versionada del OpenAPI (pnpm api:descargar la actualiza).
export default defineConfig({
  tato: {
    input: './openapi.json',
    output: {
      target: './src/generado/api.ts',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        // Todos los pedidos pasan por pedirApi: cookie, token antiforgery y ErrorApi.
        mutator: { path: './src/pedirApi.ts', name: 'pedirApi' },
        // pedirApi devuelve los datos, no la respuesta entera.
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
})
