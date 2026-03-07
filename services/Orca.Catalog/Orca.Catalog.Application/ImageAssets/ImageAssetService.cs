using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;

namespace Orca.Catalog.Application.ImageAssets;

public interface IImageAssetService
{
    Task<IEnumerable<ImageAssetDto>> GetAllAsync();
    Task<ImageAssetDto?> GetBySlugAsync(string slug);
    Task<ImageAssetDto> CreateAsync(CreateImageAssetDto dto);
    Task<ImageAssetDto?> DeleteAsync(string slug);
}

public class ImageAssetService : IImageAssetService
{
    private readonly IImageAssetRepository _repository;

    public ImageAssetService(IImageAssetRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<IEnumerable<ImageAssetDto>> GetAllAsync()
    {
        var assets = await _repository.GetAllAsync();
        return assets.Select(ToDto);
    }

    public async Task<ImageAssetDto?> GetBySlugAsync(string slug)
    {
        var asset = await _repository.GetBySlugAsync(slug);
        return asset == null ? null : ToDto(asset);
    }

    public async Task<ImageAssetDto> CreateAsync(CreateImageAssetDto dto)
    {
        if (await _repository.SlugExistsAsync(dto.Slug))
            throw new InvalidOperationException($"Já existe um ImageAsset com o slug '{dto.Slug}'.");

        var entity = new ImageAsset
        {
            Slug = dto.Slug,
            Name = dto.Name,
            Url = dto.Url,
            ContentType = dto.ContentType,
            SizeBytes = dto.SizeBytes
        };

        var created = await _repository.CreateAsync(entity);
        return ToDto(created);
    }

    public async Task<ImageAssetDto?> DeleteAsync(string slug)
    {
        var existing = await _repository.GetBySlugAsync(slug);
        if (existing == null)
            return null;

        var dto = ToDto(existing);
        await _repository.DeleteAsync(existing);
        return dto;
    }

    private static ImageAssetDto ToDto(ImageAsset a)
        => new(a.Id, a.Slug, a.Name, a.Url, a.ContentType, a.SizeBytes, a.CreatedAtUtc);
}