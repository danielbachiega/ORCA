using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Orca.Catalog.Domain.Repositories;
using Orca.Catalog.Infrastructure.Repositories;

namespace Orca.Catalog.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCatalogInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Registrar Repositories
        services.AddScoped<IOfferRepository, OfferRepository>();
        // services.AddScoped<IFormDefinitionRepository, FormDefinitionRepository>(); // Removed as per requirement
        return services;
    }
}
