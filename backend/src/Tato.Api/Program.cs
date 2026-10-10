using Tato.Api.Estudios;
using Tato.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Los comandos de consola (P-19) no levantan el servidor y usan la consola para pedir los datos:
// se apagan los logs para que no se mezclen con las preguntas.
var esComando = ComandosEstudios.EsComando(args);

if (esComando)
    builder.Logging.ClearProviders();

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAutenticacion();
builder.Services.AddEstudios();

var app = builder.Build();

if (esComando)
{
    Environment.ExitCode = await ComandosEstudios.EjecutarAsync(app.Services, args);
    return;
}

if (app.Environment.IsDevelopment())
{
    // Por la política por defecto todo pide sesión: el documento de OpenAPI se abre explícitamente.
    app.MapOpenApi().AllowAnonymous();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.Run();