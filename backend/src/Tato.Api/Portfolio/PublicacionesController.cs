using Microsoft.AspNetCore.Mvc;
using Tato.Application.Comun;
using Tato.Application.Portfolio;
using Tato.Domain.Portfolio;

namespace Tato.Api.Portfolio;

/// <summary>
/// Publicaciones del panel privado. Exige sesión (política por defecto) y todo es del estudio de la sesión (D-42).
/// </summary>
[ApiController]
[Route("api/publicaciones")]
public sealed class PublicacionesController : ControllerBase
{
    /// <summary>
    /// «Mis publicaciones»: de la modificada más recientemente a la más vieja, opcionalmente por estado, por tipo y
    /// por página (RN-BLG-12): la de un artista (tatuadorId) o la del estudio (delEstudio). 400 si vienen las dos.
    /// </summary>
    [HttpGet]
    [EndpointName("listarPublicaciones")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<ActionResult<Pagina<PublicacionResumen>>> Listar(
        [FromServices] IConsultasPublicaciones consultas,
        [FromQuery] EstadoPublicacion? estado,
        [FromQuery] TipoPublicacion? tipo,
        [FromQuery] Guid? tatuadorId,
        [FromQuery] bool delEstudio = false,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = Paginacion.TamanioPorDefecto,
        CancellationToken cancellationToken = default)
    {
        if (tatuadorId is not null && delEstudio)
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Los datos enviados no son válidos.",
                detail: "Elegí una sola página: la de un artista o la del estudio.");

        return await consultas.ListarAsync(
            new FiltroPublicaciones(estado, new Paginacion(pagina, tamanio), tipo, tatuadorId, delEstudio),
            cancellationToken);
    }

    /// <summary>
    /// Una publicación con sus fotos. 404 si no existe o es de otro estudio.
    /// </summary>
    [HttpGet("{id:guid}")]
    [EndpointName("obtenerPublicacion")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<PublicacionDetalle>> Obtener(
        Guid id,
        [FromServices] IConsultasPublicaciones consultas,
        CancellationToken cancellationToken)
    {
        var detalle = await consultas.ObtenerAsync(id, cancellationToken);

        return detalle is null ? NotFound() : detalle;
    }

    /// <summary>
    /// Crea una publicación en Borrador y devuelve su Id.
    /// </summary>
    [HttpPost]
    [EndpointName("crearPublicacion")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<PublicacionCreadaRespuesta>> Crear(
        SolicitudPublicacion solicitud,
        [FromServices] CrearPublicacion crearPublicacion,
        CancellationToken cancellationToken)
    {
        var id = await crearPublicacion.EjecutarAsync(solicitud.ADatos(), cancellationToken);

        return CreatedAtAction(nameof(Obtener), new { id }, new PublicacionCreadaRespuesta(id));
    }

    /// <summary>
    /// Reemplaza los datos de la publicación. Devuelve la versión nueva, para seguir editando sin recargar.
    /// 409 si alguien la modificó desde que se abrió.
    /// </summary>
    [HttpPut("{id:guid}")]
    [EndpointName("editarPublicacion")]
    public async Task<PublicacionVersionRespuesta> Editar(
        Guid id,
        SolicitudEditarPublicacion solicitud,
        [FromServices] EditarPublicacion editarPublicacion,
        CancellationToken cancellationToken)
    {
        var version = await editarPublicacion.EjecutarAsync(id, solicitud.ADatos(), solicitud.Version, cancellationToken);

        return new PublicacionVersionRespuesta(version);
    }
}

/// <summary>
/// Datos de una publicación nueva tal como los manda el panel. No trae estudio ni usuario: salen de la sesión.
/// Si no trae el tipo, es un trabajo.
/// </summary>
public sealed record SolicitudPublicacion(
    string Titulo,
    string? Descripcion,
    DateOnly? FechaTrabajo,
    Guid? EstiloId,
    Guid? ZonaCuerpoId,
    Guid? TatuadorId,
    bool Destacada,
    TipoPublicacion Tipo = TipoPublicacion.Trabajo)
{
    internal DatosPublicacion ADatos() =>
        new(Titulo, Descripcion, FechaTrabajo, EstiloId, ZonaCuerpoId, TatuadorId, Destacada, Tipo);
}

/// <summary>
/// Los datos nuevos de la publicación, más la versión que tenía el panel al abrirla. Reemplaza todos los datos,
/// así que el tipo es obligatorio: si no viene, el dominio lo rechaza (400) en lugar de volverlo a Trabajo.
/// </summary>
public sealed record SolicitudEditarPublicacion(
    string Titulo,
    string? Descripcion,
    DateOnly? FechaTrabajo,
    Guid? EstiloId,
    Guid? ZonaCuerpoId,
    Guid? TatuadorId,
    bool Destacada,
    TipoPublicacion Tipo,
    string Version)
{
    internal DatosPublicacion ADatos() =>
        new(Titulo, Descripcion, FechaTrabajo, EstiloId, ZonaCuerpoId, TatuadorId, Destacada, Tipo);
}

public sealed record PublicacionCreadaRespuesta(Guid Id);

public sealed record PublicacionVersionRespuesta(string Version);
