import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ServerOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [react(), tailwindcss()],
  // El alias @ (lo usa shadcn/ui) se define una sola vez, en los paths de tsconfig.app.json.
  resolve: { tsconfigPaths: true },
  // Solo para pnpm dev: el build y los tests no necesitan el certificado.
  server: command === 'serve' && mode !== 'test' ? servidorDeDesarrollo() : undefined,
}))

/**
 * Por HTTPS y con /api en el mismo origen, como en producción: la cookie __Host- de la sesión solo viaja por HTTPS,
 * y así no hace falta CORS.
 */
function servidorDeDesarrollo(): ServerOptions {
  const { cert, key } = certificadoDeDotnet()

  return {
    https: { cert, key },
    // La API levantada con --launch-profile https. Node no confía en el certificado de desarrollo: el proxy lo
    // verifica contra el mismo archivo, en lugar de apagar la verificación.
    proxy: { '/api': { target: 'https://localhost:7239', ca: cert } },
  }
}

/**
 * El certificado de desarrollo de .NET (dotnet dev-certs https), el mismo que usa la API. La primera vez lo exporta
 * fuera del repo, a la carpeta que usa la plantilla de ASP.NET con React.
 */
function certificadoDeDotnet() {
  const carpeta = process.env.APPDATA
    ? join(process.env.APPDATA, 'ASP.NET', 'https')
    : join(homedir(), '.aspnet', 'https')
  const cert = join(carpeta, 'tato.pem')
  const key = join(carpeta, 'tato.key')

  if (!existsSync(cert) || !existsSync(key)) {
    mkdirSync(carpeta, { recursive: true })
    execFileSync('dotnet', ['dev-certs', 'https', '--export-path', cert, '--format', 'Pem', '--no-password'], {
      stdio: 'inherit',
    })
  }

  return { cert: readFileSync(cert, 'utf8'), key: readFileSync(key, 'utf8') }
}
