import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useIniciarSesion, type ErrorApi } from '@tato/api-client'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { claveSesion, useSesion } from './sesion'
import { SinConexion } from './SinConexion'

const esquema = z.object({
  email: z.email('Escribí un email válido.'),
  password: z.string().min(1, 'Escribí tu contraseña.'),
})

/**
 * Lo que ve la persona si no pudo entrar. La API responde 401 también si la cuenta está bloqueada, a propósito: así
 * nadie averigua qué emails tienen cuenta.
 */
function mensajeDeError(error: ErrorApi) {
  if (error.status === 401) return 'El email o la contraseña no son correctos.'
  if (error.status === 429) return 'Hiciste muchos intentos. Esperá un minuto.'
  return error.detail
}

/**
 * Inicio de sesión (doc 07, 8). En la versión 1 no hay «Olvidé mi contraseña». Con sesión, va a las publicaciones.
 */
export function Ingresar() {
  const sesion = useSesion()
  const cliente = useQueryClient()
  // Al entrar se vuelve a pedir la sesión, que trae el token antiforgery nuevo: el anterior ya no sirve.
  const login = useIniciarSesion({
    mutation: { onSuccess: () => cliente.invalidateQueries({ queryKey: claveSesion }) },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(esquema) })

  if (sesion.isPending) return <p className="p-4">Cargando…</p>

  if (sesion.isError) return <SinConexion reintentar={() => void sesion.refetch()} />

  if (sesion.data) return <Navigate to="/publicaciones" replace />

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-4 pt-12">
      <h1 className="text-xl font-semibold">Iniciar sesión</h1>

      <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit((data) => login.mutate({ data }))}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {login.error && (
          <p role="alert" className="text-sm text-destructive">
            {mensajeDeError(login.error)}
          </p>
        )}

        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  )
}
