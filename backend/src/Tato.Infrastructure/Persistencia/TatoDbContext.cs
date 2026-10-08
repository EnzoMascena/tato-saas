using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Tato.Domain.Estudios;
using Tato.Infrastructure.Estudios;

namespace Tato.Infrastructure.Persistencia;

/// <summary>
/// Contexto de EF Core del sistema: una sola base compartida por todos los estudios (D-42).
/// Hereda de IdentityUserContext para guardar las cuentas de login (R-09). No usa las tablas
/// de roles de Identity: los roles salen de Usuario.Roles.
/// El mapeo de cada entidad vive en su propia IEntityTypeConfiguration, en la carpeta de su módulo.
/// </summary>
public sealed class TatoDbContext : IdentityUserContext<CuentaUsuario, Guid>
{
    public TatoDbContext(DbContextOptions<TatoDbContext> options)
        : base(options)
    {
    }

    // Solo lectura (=> Set<T>()): no generan el warning de nullable y nadie puede reemplazarlos.
    public DbSet<Estudio> Estudios => Set<Estudio>();

    public DbSet<Usuario> Usuarios => Set<Usuario>();

    public DbSet<Tatuador> Tatuadores => Set<Tatuador>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Primero el modelo de Identity (AspNetUsers y sus tablas); después el nuestro.
        base.OnModelCreating(modelBuilder);

        // Aplica todas las IEntityTypeConfiguration<T> de este proyecto.
        // Una entidad nueva solo necesita su clase de configuración: no hay que registrarla acá.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TatoDbContext).Assembly);
    }
}