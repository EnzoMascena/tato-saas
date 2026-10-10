using Tato.Application.Estudios;

namespace Tato.Api.Estudios;

/// <summary>
/// Registra los casos de uso del módulo Estudios e identidad (doc 06, 3.2).
/// </summary>
public static class EstudiosExtensions
{
    public static IServiceCollection AddEstudios(this IServiceCollection services)
    {
        services.AddScoped<AltaEstudio>();
        services.AddScoped<AltaUsuario>();

        return services;
    }
}