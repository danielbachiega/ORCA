using Microsoft.EntityFrameworkCore;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;

namespace Orca.Catalog.Infrastructure.Repositories;

public class ImageAssetRepository : IImageAssetRepository
{
    private readonly CatalogContext _context;

    public ImageAssetRepository(CatalogContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<ImageAsset>> GetAllAsync()
    {
        return await _context.ImageAssets
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<ImageAsset?> GetBySlugAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Slug não pode estar vazio", nameof(slug));

        return await _context.ImageAssets
            .FirstOrDefaultAsync(x => x.Slug == slug);
    }

    public async Task<ImageAsset> CreateAsync(ImageAsset asset)
    {
        if (asset == null)
            throw new ArgumentNullException(nameof(asset));

        _context.ImageAssets.Add(asset);
        await _context.SaveChangesAsync();

        return asset;
    }

    public async Task DeleteAsync(ImageAsset asset)
    {
        if (asset == null)
            throw new ArgumentNullException(nameof(asset));

        _context.ImageAssets.Remove(asset);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> SlugExistsAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        return await _context.ImageAssets.AnyAsync(x => x.Slug == slug);
    }
}