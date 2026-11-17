import { Navigate, Route, Routes } from 'react-router'
import { MiPagina } from '@/features/paginas/MiPagina'
import { Publicaciones } from '@/features/publicaciones/Publicaciones'
import { Ingresar } from '@/features/sesion/Ingresar'
import { RutaProtegida } from '@/features/sesion/RutaProtegida'

function App() {
  return (
    <Routes>
      <Route path="/ingresar" element={<Ingresar />} />
      <Route element={<RutaProtegida />}>
        <Route path="/publicaciones" element={<Publicaciones />} />
        <Route path="/mi-pagina" element={<MiPagina />} />
      </Route>
      <Route path="*" element={<Navigate to="/publicaciones" replace />} />
    </Routes>
  )
}

export default App
