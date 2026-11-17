import { CircleUser, Images } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { CerrarSesion } from '@/features/sesion/CerrarSesion'
import { useSesion } from '@/features/sesion/sesion'

const secciones = [
  { ruta: '/publicaciones', nombre: 'Publicaciones', Icono: Images },
  { ruta: '/mi-pagina', nombre: 'Mi página', Icono: CircleUser },
]

/**
 * El marco de las pantallas con sesión, pensado para el celular: arriba, quién entró y Cerrar sesión; abajo, las
 * secciones, al alcance del pulgar.
 */
export function MarcoDelPanel() {
  const { data: usuario } = useSesion()

  return (
    <div className="min-h-dvh pb-16">
      <header className="flex items-center justify-between gap-2 border-b px-4">
        <span className="truncate text-sm text-muted-foreground">{usuario?.nombre}</span>
        <CerrarSesion />
      </header>

      <main>
        <Outlet />
      </main>

      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 grid grid-cols-2 border-t bg-background">
        {secciones.map(({ ruta, nombre, Icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`
            }
          >
            <Icono aria-hidden className="size-5" />
            {nombre}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
