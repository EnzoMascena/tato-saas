using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Tato.Application.Estudios;
using Tato.Infrastructure.Estudios;
using Tato.Infrastructure.Persistencia;

namespace Tato.Infrastructure;

/// <summary>
/// Registra los servicios de Infrastructure. La Api lo llama una sola vez desde Program.cs:
/// depende de Infrastructure solo para componer (doc 06, 3.1).
/// </summary>
public static class DependencyInjection
{
    private const string NombreCadenaConexion = "Tato";

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Desarrollo: user-secrets. Producción: variable de entorno ConnectionStrings__Tato.
        // Nunca en el repositorio (doc 06, 7.3).
        var cadenaConexion = configuration.GetConnectionString(NombreCadenaConexion);

        // Si falta, mejor fallar al arrancar que en la primera consulta.
        if (string.IsNullOrWhiteSpace(cadenaConexion))
            throw new InvalidOperationException(
                $"Falta la cadena de conexión 'ConnectionStrings:{NombreCadenaConexion}'. " +
                "En desarrollo se carga con dotnet user-secrets en el proyecto Tato.Api.");

        services.AddDbContext<TatoDbContext>(options => options.UseSqlServer(cadenaConexion));

        // Adaptadores de los puertos de Application (doc 06, 6.1).
        services.AddScoped<IRegistroEstudios, RegistroEstudios>();

        return services;
    }
}