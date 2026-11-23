import { describe, expect, it } from 'vitest'
import { puedePublicarOcultar } from './permisos'

const delEstudio = { tatuadorId: null }
const deInk = { tatuadorId: 't-ink' }

describe('quién puede publicar u ocultar (D-51)', () => {
  it.each([
    ['el artista, en su página', { roles: ['Tatuador'], tatuadorId: 't-ink' }, deInk, true],
    ['un Dueño que es el artista, en su página', { roles: ['Duenio', 'Tatuador'], tatuadorId: 't-ink' }, deInk, true],
    ['otro artista, en la página de Ink', { roles: ['Tatuador'], tatuadorId: 't-emma' }, deInk, false],
    ['un Dueño que no es el artista, en la página de Ink', { roles: ['Duenio'], tatuadorId: null }, deInk, false],
    ['un Dueño que es otro artista, en la página de Ink', { roles: ['Duenio', 'Tatuador'], tatuadorId: 't-emma' }, deInk, false],
    ['un Dueño, en la del estudio', { roles: ['Duenio'], tatuadorId: null }, delEstudio, true],
    ['un Dueño y Tatuador, en la del estudio', { roles: ['Duenio', 'Tatuador'], tatuadorId: 't-ink' }, delEstudio, true],
    ['un Administrativo, en la del estudio', { roles: ['Administrativo'], tatuadorId: null }, delEstudio, true],
    ['un Tatuador, en la del estudio', { roles: ['Tatuador'], tatuadorId: 't-ink' }, delEstudio, false],
  ])('%s', (_quien, usuario, publicacion, puede) => {
    expect(puedePublicarOcultar(usuario, publicacion)).toBe(puede)
  })
})
