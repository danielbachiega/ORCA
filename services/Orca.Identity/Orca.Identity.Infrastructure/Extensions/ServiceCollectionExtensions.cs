using Microsoft.EntityFrameworkCore;
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
        string connectionString,
        string jwtSecretKey)
    {
        // 1️⃣ DbContext (EF Core)
        services.AddDbContext<IdentityContext>(options =>
            options.UseNpgsql(connectionString));

        // 2️⃣ Repositórios
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // 3️⃣ LDAP
        services.AddScoped<ILdapClient, LdapClient>();

        // 4️⃣ OIDC
        services.AddScoped<IOidcValidator, OidcValidator>();

        // 5️⃣ JWT Generator
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