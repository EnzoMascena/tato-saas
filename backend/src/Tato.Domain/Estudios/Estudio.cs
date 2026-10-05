namespace Tato.Domain.Estudios;

///<summary>
/// Un estudio de tatuajes: tenant raíz. Sus datos están completamente aislados de otros estudios (RN-VIS-01).
///</summary>

public sealed class Estudio
{
    private Estudio(
        Guid id,
        string nombre,
        string plan,
        string zonaHoraria,
        int diasVencimientoSenia,
        int maxReagendamientos)
    {
        Id = id;
        Nombre = nombre;
        Plan = plan;
        ZonaHoraria = zonaHoraria;
        DiasVencimientoSenia = diasVencimientoSenia;
        MaxReagendamientos = maxReagendamientos;
    }

    ///<summary>
    ///Identificador uncio del estudio (UUID). Lo genera la base de datos.
    /// </summary>
    public Guid Id { get; }

    ///<summary>
    ///Nombre del estudio
    /// </summary>
    public string Nombre { get; private set;}

    ///<summary>
    ///Plan de facturacion (todavia no definido)
    /// </summary>
    public string Plan { get; private set;}

    ///<summary>
    ///Zona horaria del estudio (ej: "America/Argentina/Buenos_Aires").
    ///Las reglas como "00:00 del día siguiente" (RN-TUR-06) se aplican en esta zona.
    ///Por defecto, Argentina (D-43).
    ///</summary>
    public string ZonaHoraria{ get; private set;}

    ///<summary>
    /// Días que dura una seña desde el pago (por defecto, 14). Configurable por estudio (D-34).
    /// </summary>
    public int DiasVencimientoSenia { get; private set;}

    ///<summary>
    ///Máximo de reagendamientos permitidos (por defecto, 2). Configurable por estudio (D-34).
    /// </summary>
    public int MaxReagendamientos { get; private set;}

    public static Estudio Crear(
        string nombre,
        string plan,
        string? zonaHoraria = null,
        int? diasVencimientoSenia = null,
        int? maxReagendamientos = null
        )
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException ("El nombre del estudio no puede estar vacio.", nameof(nombre));
        
        if (nombre.Length > 100)
            throw new ArgumentException("El nombre no puede exceder 100 caracteres. ", nameof(nombre));
        
        if (string.IsNullOrWhiteSpace(plan))
            throw new ArgumentException("El plan no puede estar vacio: ", nameof(plan));
        
        // Usa valores por defecto si no se especifican (D-34)
        var zona = zonaHoraria ?? "America/Argentina/Buenos_Aires";
        var dias = diasVencimientoSenia ?? 14;
        var max = maxReagendamientos ?? 2;

        if (dias <= 0)
            throw new ArgumentException("Los días de vencimiento de seña deben ser mayor a 0.", nameof(diasVencimientoSenia));

        if (max < 0)
            throw new ArgumentException("El máximo de reagendamientos no puede ser negativo.", nameof(maxReagendamientos));

        // Genera un ID nuevo. Lo puede hacer Domain porque es un UUID.
        var id = Guid.NewGuid();

        return new Estudio(id, nombre, plan, zona, dias, max);
    }
    
    /// <summary>
    /// Cambia los parámetros de negocio del estudio (plazo de seña, máx. reagendamientos).
    /// Solo el Dueño puede hacerlo.
    /// </summary>
    public void ConfigurarParametros(int diasVencimientoSenia, int maxReagendamientos)
    {
        if (diasVencimientoSenia <= 0)
            throw new ArgumentException("Los días deben ser mayor a 0.", nameof(diasVencimientoSenia));

        if (maxReagendamientos < 0)
            throw new ArgumentException("El máximo de reagendamientos no puede ser negativo.", nameof(maxReagendamientos));

        DiasVencimientoSenia = diasVencimientoSenia;
        MaxReagendamientos = maxReagendamientos;
    }
}