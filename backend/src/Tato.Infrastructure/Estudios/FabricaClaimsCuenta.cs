using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tato.Application.Estudios;
using Tato.Domain.Estudios;
using Tato.Infrastructure.Persistencia;

namespace Tato.Infrastructure.Estudios;

/// <summary>
/// Arma los claims de la cookie al iniciar sesión: los de Identity (Id, email y security stamp)
/// más el estudio, el nombre y los roles, que salen del <see cref="Usuario"/> del dominio.
/// </summary>
public sealed class FabricaClaimsCuenta : UserClaimsPrincipalFactory<CuentaUsuario>
{
    private readonly TatoDbContext _contexto;

    public FabricaClaimsCuenta(
        UserManager<CuentaUsuario> userManager,
        IOptions<IdentityOptions> opciones,
        TatoDbContext contexto)
        : base(userManager, opciones)
    {
        _contexto = contexto;
    }

    protected override async Task<ClaimsIdentity> GenerateClaimsAsync(CuentaUsuario cuenta)
    {
        var identidad = await base.GenerateClaimsAsync(cuenta);

        // Al iniciar sesión todavía no hay estudio en la sesión: esta consulta saltea a propósito
        // el filtro por estudio, y solo ese.
        var usuario = await _contexto.Usuarios
            .AsNoTracking()
            .IgnoreQueryFilters([TatoDbContext.FiltroEstudio])
            .SingleAsync(u => u.Id == cuenta.Id);

        identidad.AddClaim(new Claim(ClaimsTato.EstudioId, usuario.EstudioId.ToString()));
        identidad.AddClaim(new Claim(ClaimsTato.Nombre, usuario.Nombre));

        // Rol es [Flags]: un claim por cada rol que tenga el usuario.
        foreach (var rol in Enum.GetValues<Rol>().Where(r => usuario.Roles.HasFlag(r)))
            identidad.AddClaim(new Claim(Options.ClaimsIdentity.RoleClaimType, rol.ToString()));

        return identidad;
    }
}