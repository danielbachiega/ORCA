using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Orca.Catalog.Domain.Repositories;
using Orca.Catalog.Infrastructure.Repositories;
using Orca.Catalog.Application.Offers;
using Orca.Catalog.Application.ImageAssets;
using Orca.Catalog.Infrastructure.Storage;

namespace Orca.Catalog.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCatalogInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Registrar Repositories
        services.AddScoped<IOfferRepository, OfferRepository>();
        
        // Registrar Serviços de Aplicação
        services.AddScoped<IOfferService, OfferService>();

        services.AddScoped<IImageAssetRepository, ImageAssetRepository>();

        services.AddScoped<IImageAssetService, ImageAssetService>();


        services.Configure<ImageAssetStorageOptions>(config.GetSection("ImageAssetStorage"));
        services.AddScoped<IImageAssetStorage, LocalImageAssetStorage>();
        
        return services;
    }
}