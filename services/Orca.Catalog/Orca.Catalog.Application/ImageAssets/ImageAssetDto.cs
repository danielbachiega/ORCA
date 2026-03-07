namespace Orca.Catalog.Application.ImageAssets;

public record ImageAssetDto(
    Guid Id,
    string Slug,
    string Name,
    string Url,
    string ContentType,
    long SizeBytes,
    DateTime CreatedAtUtc);

public class CreateImageAssetDto
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}