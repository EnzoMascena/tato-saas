using Tato.Api.Estudios;
using Tato.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAutenticacion();

var app = builder.Build();

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