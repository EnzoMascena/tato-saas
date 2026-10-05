namespace Tato.Domain.Tests.Estudios;

using Tato.Domain.Estudios;
using Xunit;

public class DuenioTest
{
    [Fact]
    public void Crear_ConDatosValidos_DebuelveDuenio()
    {
        // Arrange
        var usuarioId = Guid.NewGuid();

        // Act
        var duenio = Duenio.Crear(usuarioId);

        // Assert
        Assert.NotEqual(Guid.Empty, duenio.Id);
        Assert.Equal(usuarioId, duenio.UsuarioId);
    }

    [Fact]
    public void Crear_ConUsuarioIdVacio_LanzaArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Duenio.Crear(Guid.Empty));
        Assert.Contains("no puede estar vacío", ex.Message);
    }
}