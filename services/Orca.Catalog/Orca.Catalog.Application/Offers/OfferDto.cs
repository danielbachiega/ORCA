namespace Orca.Catalog.Application.Offers;

public record OfferSummaryDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string[] Tags,
    bool Active,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc);

public record OfferDetailsDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string[] Tags,
    bool Active,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    string[] VisibleToRoles);

// === DTOs de Entrada ===
public class CreateOfferDto
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public bool Active { get; set; } = true;
    public string[] VisibleToRoles { get; set; } = Array.Empty<string>();
}

public class UpdateOfferDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public bool Active { get; set; } = true;
    public string[] VisibleToRoles { get; set; } = Array.Empty<string>();
}
