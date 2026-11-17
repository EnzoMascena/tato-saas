import { Navigate, Route, Routes } from 'react-router'
import { MiPagina } from '@/features/paginas/MiPagina'
import { EditarPublicacion } from '@/features/publicaciones/EditarPublicacion'
import { Publicaciones } from '@/features/publicaciones/Publicaciones'
import { Ingresar } from '@/features/sesion/Ingresar'
import { RutaProtegida } from '@/features/sesion/RutaProtegida'
import { MarcoDelPanel } from '@/MarcoDelPanel'

function App() {
  return (
    <Routes>
      <Route path="/ingresar" element={<Ingresar />} />
      <Route element={<RutaProtegida />}>
        <Route element={<MarcoDelPanel />}>
          <Route path="/publicaciones" element={<Publicaciones />} />
          <Route path="/publicaciones/nueva" element={<EditarPublicacion />} />
          <Route path="/publicaciones/:id" element={<EditarPublicacion />} />
          <Route path="/mi-pagina" element={<MiPagina />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/publicaciones" replace />} />
    </Routes>
  )
}

export default App
