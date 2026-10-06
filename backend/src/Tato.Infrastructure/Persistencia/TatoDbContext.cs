using Microsoft.EntityFrameworkCore;
using Tato.Domain.Estudios;

namespace Tato.Infrastructure.Persistencia;

/// <summary>
/// Contexto de EF Core del sistema: una sola base compartida por todos los estudios (D-42).
/// El mapeo de cada entidad vive en su propia IEntityTypeConfiguration, en la carpeta de su módulo.
/// </summary>
public sealed class TatoDbContext : DbContext
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
        base.OnModelCreating(modelBuilder);

        // Aplica todas las IEntityTypeConfiguration<T> de este proyecto.
        // Una entidad nueva solo necesita su clase de configuración: no hay que registrarla acá.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TatoDbContext).Assembly);
    }
}