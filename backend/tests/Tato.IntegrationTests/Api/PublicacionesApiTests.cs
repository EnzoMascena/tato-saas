using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Tato.IntegrationTests.Api;

/// <summary>
/// «Mis publicaciones» por HTTP: los parámetros de la página llegan a la consulta, y no se pueden pedir dos páginas a
/// la vez (RN-BLG-12).
/// </summary>
public sealed class PublicacionesApiTests : IClassFixture<ApiFixture>
{
    private readonly ApiFixture _api;

    public PublicacionesApiTests(ApiFixture api)
    {
        _api = api;
    }

    [Fact]
    public async Task Listar_ConLaPaginaDeUnArtistaYLaDelEstudio_Responde400()
    {
        // Arrange
        using var cliente = await _api.IniciarSesionAsync();

        // Act
        var respuesta = await cliente.GetAsync($"/api/publicaciones?tatuadorId={Guid.NewGuid()}&delEstudio=true");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        var problema = await respuesta.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(
            "Elegí una sola página: la de un artista o la del estudio.",
            problema.GetProperty("detail").GetString());
    }
}
