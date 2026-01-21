using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Orca.Catalog.Domain.Repositories;
using Orca.Catalog.Infrastructure.Repositories;
using Orca.Catalog.Application.Offers;

namespace Orca.Catalog.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCatalogInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Registrar Repositories
        services.AddScoped<IOfferRepository, OfferRepository>();
        
        // Registrar Serviços de Aplicação
        services.AddScoped<IOfferService, OfferService>();
        
        return services;
    }
}