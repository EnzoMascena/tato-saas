using Tato.Domain.Estudios;

namespace Tato.Application.Estudios;

/// <summary>
/// Caso de uso: dar de alta un estudio (tenant). En la versión 1 lo usa el desarrollador desde la consola (P-19);
/// en la 2 lo va a usar el alta por autoservicio.
/// </summary>
public sealed class AltaEstudio
{
    private readonly IRegistroEstudios _registro;

    public AltaEstudio(IRegistroEstudios registro)
    {
        _registro = registro;
    }

    /// <summary>
    /// Crea el estudio y devuelve su Id. Valida el dominio: si un dato no sirve, lanza ArgumentException.
    /// Si la zona horaria viene vacía, se usa la de Argentina (D-43).
    /// </summary>
    public async Task<Guid> EjecutarAsync(
        string nombre,
        string plan,
        string? zonaHoraria,
        CancellationToken cancellationToken = default)
    {
        var estudio = Estudio.Crear(nombre, plan, zonaHoraria);

        await _registro.AgregarEstudioAsync(estudio, cancellationToken);

        return estudio.Id;
    }
}
