namespace Tato.Domain.Estudios;


/// <summary>
/// Roles de usuario en el estudio (D-03).
/// </summary>
[Flags]
public enum Rol
{
    Dueno = 1,
    Tatuador = 2,
    Administrativo = 4
}

///<summary>
/// Un usuario
/// </summary>
public sealed class Usuario
{
    private Usuario(
        Guid id,
        Guid estudioId,
        string email,
        string nombre,
        Rol roles)
    {
        Id = id;
        EstudioId = estudioId;
        Email = email;
        Nombre = nombre;
        Roles = roles;
    }

    ///<summary>
    /// Identificador unico del Usuario (UUID) . Lo genera la base de datos
    /// </summary>
    public Guid Id { get; }

    ///<summary>
    /// Guid del estudio al que pertenece el Usuario
    ///</summary>
    public Guid EstudioId { get; }

    ///<summary>
    /// Email del usuario
    /// </summary>
    public string Email { get; private set; }

    ///<summary>
    /// Nombre del usuario
    /// </summary>
    public string Nombre { get; private set; }

    ///<summary>
    /// Roles del usuario del estudio (D-03)
    ///</summary>
    public Rol Roles { get; private set; }

    public static Usuario Crear(
        Guid estudioId,
        string email,
        string nombre,
        Rol roles)
    {
        // Validaciones
        if (estudioId == Guid.Empty)
            throw new ArgumentException("El EstudioId no puede estar vacío.", nameof(estudioId));

        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("El email no puede estar vacío.", nameof(email));

        if (email.Length > 256)
            throw new ArgumentException("El email no puede exceder 256 caracteres.", nameof(email));

        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre no puede estar vacío.", nameof(nombre));

        if (nombre.Length > 100)
            throw new ArgumentException("El nombre no puede exceder 100 caracteres.", nameof(nombre));

        ValidarRoles(roles);

        var id = Guid.NewGuid();
        return new Usuario(id, estudioId, email, nombre, roles);
    }

    /// <summary>
    /// Cambia los roles del usuario. Solo el Dueño puede hacer esto.
    /// </summary>
    public void CambiarRoles(Rol nuevosRoles)
    {
        ValidarRoles(nuevosRoles);
        Roles = nuevosRoles;
    }

    /// <summary>
    /// Valida que los roles cumplan con las reglas de negocio (D-03).
    /// </summary>
    private static void ValidarRoles(Rol roles)
    {
        // Al menos un rol
        if (roles == 0)
            throw new ArgumentException("El usuario debe tener al menos un rol.", nameof(roles));

        // Si no es Dueño, no puede ser Tatuador y Administrativo juntos
        bool esDueno = roles.HasFlag(Rol.Dueno);
        bool esTatuador = roles.HasFlag(Rol.Tatuador);
        bool esAdministrativo = roles.HasFlag(Rol.Administrativo);

        if (!esDueno && esTatuador && esAdministrativo)
            throw new ArgumentException("Un usuario que no es Dueño no puede ser Tatuador y Administrativo a la vez.", nameof(roles));
    }
}