namespace Tato.Domain.Estudios;

/// <summary>
/// Perfil de Dueño: un usuario con este perfil puede gestionar el estudio.
/// Se activa cuando un usuario Dueño se comporta como tal (D-03, D-06).
/// </summary>
public sealed class Duenio
{
    private Duenio(Guid id, Guid usuarioId)
    {
        Id = id;
        UsuarioId = usuarioId;
    }

    /// <summary>
    /// Identificador único del perfil Dueño (UUID).
    /// </summary>
    public Guid Id { get; }

    /// <summary>
    /// El usuario que tiene este perfil.
    /// </summary>
    public Guid UsuarioId { get; }

    /// <summary>
    /// Crea el perfil Dueño para un usuario.
    /// </summary>
    public static Duenio Crear(Guid usuarioId)
    {
        if (usuarioId == Guid.Empty)
            throw new ArgumentException("El UsuarioId no puede estar vacío.", nameof(usuarioId));

        var id = Guid.NewGuid();
        return new Duenio(id, usuarioId);
    }
}