namespace Orca.Catalog.Application.ImageAssets;

public record StoredImageResult(string Url, string ContentType, long SizeBytes);

public interface IImageAssetStorage
{
    Task<StoredImageResult> SaveAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken ct = default);

    Task DeleteAsync(string url, CancellationToken ct = default);
}