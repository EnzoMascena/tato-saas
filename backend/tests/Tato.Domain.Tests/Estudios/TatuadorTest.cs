namespace Tato.Domain.Tests.Estudios;

using Tato.Domain.Estudios;
using Xunit;

public class TatuadorTest
{
    /// <summary>
    /// Crea un usuario para los tests. Por defecto, con rol Tatuador.
    /// </summary>
    private static Usuario CrearUsuario(Rol roles = Rol.Tatuador) =>
        Usuario.Crear(Guid.NewGuid(), "ana@example.com", "Ana", roles);

    [Fact]
    public void Crear_ConDatosValidos_DevuelveTatuador()
    {
        // Arrange
        var usuario = CrearUsuario();

        // Act
        var tatuador = Tatuador.Crear(usuario, "Ana Ink", "Blackwork y fine line.", "ana.ink");

        // Assert
        Assert.NotEqual(Guid.Empty, tatuador.Id);
        Assert.Equal(usuario.Id, tatuador.UsuarioId);
        Assert.Equal(usuario.EstudioId, tatuador.EstudioId);
        Assert.Equal("Ana Ink", tatuador.NombreArtistico);
        Assert.Equal("Blackwork y fine line.", tatuador.Bio);
        Assert.Equal("ana.ink", tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConUsuarioNull_LanzaArgumentNullException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            Tatuador.Crear(null!, "Ana Ink", null, null));
    }

    [Theory]
    [InlineData(Rol.Dueno)]
    [InlineData(Rol.Administrativo)]
    [InlineData(Rol.Dueno | Rol.Administrativo)]
    public void Crear_ConUsuarioSinRolTatuador_LanzaArgumentException(Rol roles)
    {
        // Arrange
        var usuario = CrearUsuario(roles);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(usuario, "Ana Ink", null, null));
        Assert.Contains("no tiene el rol Tatuador", ex.Message);
    }

    [Fact]
    public void Crear_ConUsuarioDuenoYTatuador_DevuelveTatuador()
    {
        // Arrange
        var usuario = CrearUsuario(Rol.Dueno | Rol.Tatuador);

        // Act
        var tatuador = Tatuador.Crear(usuario, "Ana Ink", null, null);

        // Assert
        Assert.Equal(usuario.Id, tatuador.UsuarioId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Crear_ConNombreArtisticoVacio_LanzaArgumentException(string nombre)
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(CrearUsuario(), nombre, null, null));
        Assert.Contains("no puede estar vacío", ex.Message);
    }

    [Fact]
    public void Crear_ConNombreArtisticoMuyLargo_LanzaArgumentException()
    {
        // Arrange
        var nombre = new string('a', Tatuador.MaxNombreArtistico + 1);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(CrearUsuario(), nombre, null, null));
        Assert.Contains($"no puede exceder {Tatuador.MaxNombreArtistico} caracteres", ex.Message);
    }

    [Fact]
    public void Crear_ConEspaciosAlrededor_GuardaLosTextosRecortados()
    {
        // Act
        var tatuador = Tatuador.Crear(CrearUsuario(), "  Ana Ink  ", "  Blackwork  ", null);

        // Assert
        Assert.Equal("Ana Ink", tatuador.NombreArtistico);
        Assert.Equal("Blackwork", tatuador.Bio);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Crear_ConBioEInstagramVacios_LosGuardaComoNull(string? valor)
    {
        // Act
        var tatuador = Tatuador.Crear(CrearUsuario(), "Ana Ink", valor, valor);

        // Assert
        Assert.Null(tatuador.Bio);
        Assert.Null(tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConBioMuyLarga_LanzaArgumentException()
    {
        // Arrange
        var bio = new string('a', Tatuador.MaxBio + 1);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(CrearUsuario(), "Ana Ink", bio, null));
        Assert.Contains($"no puede exceder {Tatuador.MaxBio} caracteres", ex.Message);
    }

    [Theory]
    [InlineData("ana.ink")]
    [InlineData("@ana.ink")]
    [InlineData("  @ana.ink  ")]
    public void Crear_ConInstagram_GuardaElUsuarioSinArroba(string instagram)
    {
        // Act
        var tatuador = Tatuador.Crear(CrearUsuario(), "Ana Ink", null, instagram);

        // Assert
        Assert.Equal("ana.ink", tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConInstagramSoloArroba_LoGuardaComoNull()
    {
        // Act
        var tatuador = Tatuador.Crear(CrearUsuario(), "Ana Ink", null, "@");

        // Assert
        Assert.Null(tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConInstagramMuyLargo_LanzaArgumentException()
    {
        // Arrange
        var instagram = new string('a', Tatuador.MaxInstagram + 1);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(CrearUsuario(), "Ana Ink", null, instagram));
        Assert.Contains($"no puede exceder {Tatuador.MaxInstagram} caracteres", ex.Message);
    }

    [Fact]
    public void ActualizarPerfil_ConDatosValidos_CambiaElPerfil()
    {
        // Arrange
        var tatuador = Tatuador.Crear(CrearUsuario(), "Ana Ink", "Blackwork", "ana.ink");

        // Act
        tatuador.ActualizarPerfil("Ana Tattoo", "Fine line", "@ana.tattoo");

        // Assert
        Assert.Equal("Ana Tattoo", tatuador.NombreArtistico);
        Assert.Equal("Fine line", tatuador.Bio);
        Assert.Equal("ana.tattoo", tatuador.Instagram);
    }

    [Fact]
    public void ActualizarPerfil_ConNombreVacio_NoModificaElPerfil()
    {
        // Arrange
        var tatuador = Tatuador.Crear(CrearUsuario(), "Ana Ink", "Blackwork", "ana.ink");

        // Act
        Assert.Throws<ArgumentException>(() =>
            tatuador.ActualizarPerfil("", "Otra bio", "otra.cuenta"));

        // Assert
        Assert.Equal("Ana Ink", tatuador.NombreArtistico);
        Assert.Equal("Blackwork", tatuador.Bio);
        Assert.Equal("ana.ink", tatuador.Instagram);
    }
}