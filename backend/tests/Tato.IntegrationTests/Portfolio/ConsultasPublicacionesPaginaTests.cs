using Tato.Application.Comun;
using Tato.Application.Portfolio;
using Tato.Domain.Portfolio;
using Tato.Infrastructure.Portfolio;

namespace Tato.IntegrationTests.Portfolio;

/// <summary>
/// «Mis publicaciones» por página (RN-BLG-12), contra SQL Server: la de un artista trae solo las suyas, la del estudio
/// solo las que no tienen artista, y nada de otra página ni de otro estudio.
/// </summary>
public sealed class ConsultasPublicacionesPaginaTests : IClassFixture<BaseDeDatosFixture>
{
    private static readonly DateTimeOffset Ahora = new(2026, 11, 17, 12, 0, 0, TimeSpan.Zero);

    private readonly BaseDeDatosFixture _baseDeDatos;

    // xUnit crea una instancia nueva por test: cada test usa su propio estudio y sus propios artistas.
    private readonly Guid _estudioId = Guid.NewGuid();
    private readonly Guid _usuarioId = Guid.NewGuid();
    private readonly Guid _inkMortal = Guid.NewGuid();
    private readonly Guid _emma = Guid.NewGuid();

    public ConsultasPublicacionesPaginaTests(BaseDeDatosFixture baseDeDatos)
    {
        _baseDeDatos = baseDeDatos;
    }

    [Fact]
    public async Task Listar_DeLaPaginaDeUnArtista_SoloTraeLasSuyas()
    {
        // Arrange: una en cada página.
        var deInk = Crear("De Ink Mortal", _inkMortal);
        await GuardarAsync(deInk, Crear("De Emma", _emma), Crear("Del estudio", tatuadorId: null));

        // Act
        var pagina = await ListarAsync(new FiltroPublicaciones(null, new Paginacion(), TatuadorId: _inkMortal));

        // Assert
        var unica = Assert.Single(pagina.Items);
        Assert.Equal(deInk.Id, unica.Id);
        Assert.Equal(_inkMortal, unica.TatuadorId);
        Assert.Equal(1, pagina.Total);
    }

    [Fact]
    public async Task Listar_DeLaPaginaDelEstudio_SoloTraeLasSinArtista()
    {
        // Arrange
        var delEstudio = Crear("Del estudio", tatuadorId: null);
        await GuardarAsync(delEstudio, Crear("De Ink Mortal", _inkMortal));

        // Act
        var pagina = await ListarAsync(new FiltroPublicaciones(null, new Paginacion(), DelEstudio: true));

        // Assert
        var unica = Assert.Single(pagina.Items);
        Assert.Equal(delEstudio.Id, unica.Id);
        Assert.Null(unica.TatuadorId);
    }

    [Fact]
    public async Task Listar_SinPagina_TraeLasDeTodasLasPaginas()
    {
        // Arrange
        await GuardarAsync(Crear("De Ink Mortal", _inkMortal), Crear("Del estudio", tatuadorId: null));

        // Act
        var pagina = await ListarAsync(new FiltroPublicaciones(null, new Paginacion()));

        // Assert
        Assert.Equal(2, pagina.Total);
    }

    [Fact]
    public async Task Listar_DeUnaPagina_ConSesionDeOtroEstudio_NoTraeNada()
    {
        // Arrange
        await GuardarAsync(Crear("De Ink Mortal", _inkMortal), Crear("Del estudio", tatuadorId: null));

        // Act: otro estudio pide las dos páginas de este.
        await using var contexto = _baseDeDatos.CrearContexto(Guid.NewGuid());
        var consultas = new ConsultasPublicaciones(contexto);
        var deLaArtista = await consultas.ListarAsync(
            new FiltroPublicaciones(null, new Paginacion(), TatuadorId: _inkMortal), CancellationToken.None);
        var delEstudio = await consultas.ListarAsync(
            new FiltroPublicaciones(null, new Paginacion(), DelEstudio: true), CancellationToken.None);

        // Assert
        Assert.Empty(deLaArtista.Items);
        Assert.Empty(delEstudio.Items);
    }

    private Publicacion Crear(string titulo, Guid? tatuadorId) =>
        Publicacion.Crear(_estudioId, _usuarioId, new DatosPublicacion(titulo, TatuadorId: tatuadorId), Ahora);

    private async Task GuardarAsync(params Publicacion[] publicaciones)
    {
        await using var contexto = _baseDeDatos.CrearContexto(_estudioId);
        contexto.Publicaciones.AddRange(publicaciones);
        await contexto.SaveChangesAsync();
    }

    private async Task<Pagina<PublicacionResumen>> ListarAsync(FiltroPublicaciones filtro)
    {
        await using var contexto = _baseDeDatos.CrearContexto(_estudioId);
        return await new ConsultasPublicaciones(contexto).ListarAsync(filtro, CancellationToken.None);
    }
}
