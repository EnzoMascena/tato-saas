using Tato.Application.Comun;
using Tato.Domain.Portfolio;

namespace Tato.Application.Portfolio;

/// <summary>
/// Filtros de «Mis publicaciones». Sin estado, tipo ni página, trae todas.
/// </summary>
/// <param name="Tipo">Trabajo o Blog (D-50). Va al final y es opcional, así los usos que ya existen no cambian.</param>
/// <param name="TatuadorId">Solo las de la página de ese artista (RN-BLG-12).</param>
/// <param name="DelEstudio">Solo las de la página del estudio: las que no tienen artista (RN-BLG-12).</param>
public sealed record FiltroPublicaciones(
    EstadoPublicacion? Estado,
    Paginacion Paginacion,
    TipoPublicacion? Tipo = null,
    Guid? TatuadorId = null,
    bool DelEstudio = false);
