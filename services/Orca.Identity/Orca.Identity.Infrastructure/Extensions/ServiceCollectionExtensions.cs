using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using Orca.Identity.Application.Auth;
using Orca.Identity.Domain.Auth;
using Orca.Identity.Domain.Ldap;
using Orca.Identity.Domain.Repositories;
using Orca.Identity.Infrastructure.Auth;
using Orca.Identity.Infrastructure.Ldap;
using Orca.Identity.Infrastructure.Repositories;


namespace Orca.Identity.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddIdentityInfrastructure(
        this IServiceCollection services,
            IConfiguration configuration,
        string connectionString,
        string jwtSecretKey)
    {
        // 1️⃣ DbContext (EF Core)
        services.AddDbContext<IdentityContext>(options =>
            options.UseNpgsql(connectionString));

        // 2️⃣ Repositórios
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // 3️⃣ Configurações LDAP
        services.Configure<LdapSettings>(configuration.GetSection("Ldap"));

        // 4️⃣ LDAP Client
        services.AddScoped<ILdapClient, LdapClient>();

        // 5️⃣ OIDC
        services.AddScoped<IOidcValidator, OidcValidator>();

        // 6️⃣ JWT Generator
        services.AddScoped<ISessionTokenGenerator>(sp =>
            new SessionTokenGenerator(
                secretKey: jwtSecretKey,
                issuer: "Orca.Identity",
                audience: "Orca.API"
            )
        );

        return services;
    }
}