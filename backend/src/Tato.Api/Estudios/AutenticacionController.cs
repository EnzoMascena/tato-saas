using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Tato.Application.Estudios;
using Tato.Infrastructure.Estudios;

namespace Tato.Api.Estudios;

/// <summary>
/// Inicio y cierre de sesión con cookie (D-39). No hay registro: las cuentas las da de alta
/// el desarrollador (P-19).
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AutenticacionController : ControllerBase
{
    private readonly SignInManager<CuentaUsuario> _signInManager;

    public AutenticacionController(SignInManager<CuentaUsuario> signInManager)
    {
        _signInManager = signInManager;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(AutenticacionExtensions.PoliticaLogin)]
    public async Task<IActionResult> Login(SolicitudLogin solicitud)
    {
        var resultado = await _signInManager.PasswordSignInAsync(
            solicitud.Email, solicitud.Password, isPersistent: true, lockoutOnFailure: true);

        // La misma respuesta si el email no existe, si la contraseña está mal o si la cuenta
        // está bloqueada: así nadie puede averiguar qué emails tienen cuenta.
        return resultado.Succeeded ? NoContent() : Unauthorized();
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return NoContent();
    }

    [HttpGet("yo")]
    public ActionResult<UsuarioActualRespuesta> Yo()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var estudioId = User.FindFirstValue(ClaimsTato.EstudioId);

        if (id is null || estudioId is null)
            return Unauthorized();

        return new UsuarioActualRespuesta(
            Guid.Parse(id),
            User.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
            User.FindFirstValue(ClaimsTato.Nombre) ?? string.Empty,
            Guid.Parse(estudioId),
            User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray());
    }
}

/// <summary>
/// Datos para iniciar sesión.
/// </summary>
public sealed record SolicitudLogin(string Email, string Password);

/// <summary>
/// Quién es el usuario de la sesión actual, para el panel.
/// </summary>
public sealed record UsuarioActualRespuesta(Guid Id, string Email, string Nombre, Guid EstudioId, string[] Roles);