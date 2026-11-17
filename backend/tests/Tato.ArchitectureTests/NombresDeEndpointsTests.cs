using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Routing;
using Tato.Api.Portfolio;

namespace Tato.ArchitectureTests;

/// <summary>
/// Cada endpoint tiene su nombre, único en la API. Es el operationId del OpenAPI, y con él Orval arma los nombres del
/// cliente del front (useListarPublicaciones, publicarPublicacion). Sin nombre, Orval los inventa con la ruta
/// (getApiPublicacionesId).
/// </summary>
public class NombresDeEndpointsTests
{
    private static readonly MethodInfo[] Endpoints =
    [
        .. typeof(PublicacionesController).Assembly.GetTypes()
            .Where(t => t.IsSubclassOf(typeof(ControllerBase)))
            .SelectMany(t => t.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            .Where(m => m.GetCustomAttributes<HttpMethodAttribute>().Any()),
    ];

    [Fact]
    public void CadaEndpoint_TieneNombre()
    {
        var sinNombre = Endpoints
            .Where(m => m.GetCustomAttribute<EndpointNameAttribute>() is null)
            .Select(m => $"{m.DeclaringType!.Name}.{m.Name}");

        Assert.NotEmpty(Endpoints);
        Assert.Empty(sinNombre);
    }

    [Fact]
    public void LosNombres_NoSeRepiten()
    {
        var repetidos = Endpoints
            .Select(m => m.GetCustomAttribute<EndpointNameAttribute>()?.EndpointName)
            .OfType<string>()
            .GroupBy(nombre => nombre)
            .Where(grupo => grupo.Count() > 1)
            .Select(grupo => grupo.Key);

        Assert.Empty(repetidos);
    }
}
