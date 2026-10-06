namespace Tato.Domain.Tests.Estudios;

using Tato.Domain.Estudios;
using Xunit;

public class TatuadorTests
{
    [Fact]
    public void Crear_ConDatosValidos_DevuelveTatuador()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);

        // Act
        var tatuador = Tatuador.Crear(
            usuario,
            "Enzo Art",
            "Mi bio",
            "enzo_tattoos");

        // Assert
        Assert.NotEqual(Guid.Empty, tatuador.Id);
        Assert.Equal(usuario.Id, tatuador.UsuarioId);
        Assert.Equal(usuario.EstudioId, tatuador.EstudioId);
        Assert.Equal("Enzo Art", tatuador.NombreArtistico);
        Assert.Equal("Mi bio", tatuador.Bio);
        Assert.Equal("enzo_tattoos", tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConUsuarioNull_LanzaArgumentNullException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() =>
            Tatuador.Crear(null!, "Enzo Art", "Mi bio", "enzo_tattoos"));
    }

    [Fact]
    public void Crear_ConUsuarioSinRolTatuador_LanzaArgumentException()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(usuario, "Enzo Art", "Mi bio", "enzo_tattoos"));
        Assert.Contains("debe tener el rol Tatuador", ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Crear_ConNombreArtisticoVacio_LanzaArgumentException(string nombre)
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(usuario, nombre, "Mi bio", "enzo_tattoos"));
        Assert.Contains("no puede estar vacío", ex.Message);
    }

    [Fact]
    public void Crear_ConNombreArtisticoMayorA100Caracteres_LanzaArgumentException()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);
        var nombreLargo = new string('a', 101);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(usuario, nombreLargo, "Mi bio", "enzo_tattoos"));
        Assert.Contains("no puede exceder 100 caracteres", ex.Message);
    }

    [Fact]
    public void Crear_ConBioVacia_SePermite()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);

        // Act
        var tatuador = Tatuador.Crear(usuario, "Enzo Art", "", "enzo_tattoos");

        // Assert
        Assert.Null(tatuador.Bio);
    }

    [Fact]
    public void Crear_ConBioMayorA1000Caracteres_LanzaArgumentException()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);
        var bioLarga = new string('a', 1001);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(usuario, "Enzo Art", bioLarga, "enzo_tattoos"));
        Assert.Contains("no puede exceder 1000 caracteres", ex.Message);
    }

    [Fact]
    public void Crear_ConInstagramConArroba_LaSacaAutomaticamente()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);

        // Act
        var tatuador = Tatuador.Crear(usuario, "Enzo Art", "Mi bio", "@enzo_tattoos");

        // Assert
        Assert.Equal("enzo_tattoos", tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConInstagramVacio_SePermite()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);

        // Act
        var tatuador = Tatuador.Crear(usuario, "Enzo Art", "Mi bio", "");

        // Assert
        Assert.Null(tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConInstagramSoloArroba_LoGuardaComoNull()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);

        // Act
        var tatuador = Tatuador.Crear(usuario, "Enzo Art", "Mi bio", "@");

        // Assert
        Assert.Null(tatuador.Instagram);
    }

    [Fact]
    public void Crear_ConInstagramMayorA30Caracteres_LanzaArgumentException()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);
        var instagramLargo = new string('a', 31);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Tatuador.Crear(usuario, "Enzo Art", "Mi bio", instagramLargo));
        Assert.Contains("no puede exceder 30 caracteres", ex.Message);
    }

    [Fact]
    public void ActualizarPerfil_ConDatosValidos_Actualiza()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);
        var tatuador = Tatuador.Crear(usuario, "Enzo Art", "Mi bio", "enzo_tattoos");

        // Act
        tatuador.ActualizarPerfil("Nuevo Nombre", "Nueva bio", "nuevo_instagram");

        // Assert
        Assert.Equal("Nuevo Nombre", tatuador.NombreArtistico);
        Assert.Equal("Nueva bio", tatuador.Bio);
        Assert.Equal("nuevo_instagram", tatuador.Instagram);
    }

    [Fact]
    public void ActualizarPerfil_ConNombreVacio_LanzaArgumentException()
    {
        // Arrange
        var usuario = Usuario.Crear(Guid.NewGuid(), "enzo@example.com", "Enzo", Rol.Dueno | Rol.Tatuador);
        var tatuador = Tatuador.Crear(usuario, "Enzo Art", "Mi bio", "enzo_tattoos");

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            tatuador.ActualizarPerfil("", "Nueva bio", "nuevo_instagram"));
        Assert.Contains("no puede estar vacío", ex.Message);
    }
}
