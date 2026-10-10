using Tato.Domain.Estudios;

namespace Tato.Application.Estudios;

/// <summary>
/// Puerto para dar de alta estudios y usuarios (P-19). Lo implementa Infrastructure con EF Core e Identity:
/// la cuenta y la contraseña son detalles de infraestructura que los casos de uso no conocen (D-37).
/// </summary>
public interface IRegistroEstudios
{
    Task AgregarEstudioAsync(Estudio estudio, CancellationToken cancellationToken);

    Task<bool> ExisteEstudioAsync(Guid estudioId, CancellationToken cancellationToken);

    /// <summary>
    /// Guarda el usuario, su perfil de tatuador (si tiene) y su cuenta con la contraseña: todo o nada.
    /// </summary>
    Task<ResultadoAlta> AgregarUsuarioAsync(
        Usuario usuario,
        Tatuador? perfilTatuador,
        string contrasenia,
        CancellationToken cancellationToken);
}