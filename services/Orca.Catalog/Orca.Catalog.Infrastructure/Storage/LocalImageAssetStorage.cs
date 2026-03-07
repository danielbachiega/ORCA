using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Orca.Catalog.Application.ImageAssets;

namespace Orca.Catalog.Infrastructure.Storage;

public class LocalImageAssetStorage : IImageAssetStorage
{
    private readonly ImageAssetStorageOptions _options;
    private readonly string _rootPath;

    public LocalImageAssetStorage(IOptions<ImageAssetStorageOptions> options, IHostEnvironment env)
    {
        _options = options.Value;
        _rootPath = env.ContentRootPath;
    }

    public async Task<StoredImageResult> SaveAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken ct = default)
    {
        var directory = Path.Combine(_rootPath, _options.StoragePath);
        Directory.CreateDirectory(directory);

        var ext = Path.GetExtension(fileName);
        var storedName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(directory, storedName);

        await using (var fileStream = File.Create(fullPath))
        {
            await content.CopyToAsync(fileStream, ct);
        }

        var sizeBytes = new FileInfo(fullPath).Length;
        var url = $"/image-assets/{storedName}";
        
        return new StoredImageResult(url, contentType, sizeBytes);
    }

    public Task DeleteAsync(string url, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            return Task.CompletedTask;

        var directory = Path.Combine(_rootPath, _options.StoragePath);
        var path = url;

        if (Uri.TryCreate(url, UriKind.Absolute, out var absolute))
        {
            path = absolute.LocalPath;
        }

        var fileName = Path.GetFileName(path);
        if (string.IsNullOrWhiteSpace(fileName))
            return Task.CompletedTask;

        var fullPath = Path.Combine(directory, fileName);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }
}