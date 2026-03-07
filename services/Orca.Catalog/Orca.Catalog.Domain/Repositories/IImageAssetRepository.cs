using Orca.Catalog.Domain.Entities;

namespace Orca.Catalog.Domain.Repositories;

public interface IImageAssetRepository
{
    Task<IEnumerable<ImageAsset>> GetAllAsync();
    Task<ImageAsset?> GetBySlugAsync(string slug);
    Task<ImageAsset> CreateAsync(ImageAsset asset);
    Task DeleteAsync(ImageAsset asset);
    Task<bool> SlugExistsAsync(string slug);
}