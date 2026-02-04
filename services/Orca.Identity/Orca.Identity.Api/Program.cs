using Microsoft.EntityFrameworkCore;
using Orca.Identity.Api.Middleware;
using Orca.Identity.Application.Auth;
using Orca.Identity.Application.Roles;
using Orca.Identity.Infrastructure;
using Orca.Identity.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// ========== Configuração de Serviços ==========

// 1️⃣ Controllers
builder.Services.AddControllers();

// 1.5️⃣ Exception Handler
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// 2️⃣ Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Orca Identity API", Version = "v1" });
});

// 3️⃣ Infrastructure Layer (DbContext, Repositories, LDAP, OIDC)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' não encontrada");

var jwtSecret = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey não encontrada");

builder.Services.AddIdentityInfrastructure(builder.Configuration, connectionString, jwtSecret);

// 4️⃣ Application Layer (Services)
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// 5️⃣ CORS (para o frontend acessar)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ========== Build App ==========
var app = builder.Build();

// ========== Middlewares ==========

// 1️⃣ Swagger (apenas em Development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 1.5️⃣ Exception Handler Middleware
app.UseExceptionHandler();

// 2️⃣ CORS
app.UseCors("AllowAll");

// 3️⃣ HTTPS Redirect
app.UseHttpsRedirection();

// 4️⃣ Controllers
app.MapControllers();

// ========== Aplicar Migrations Automaticamente ==========
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
    dbContext.Database.Migrate();
}

app.Run();