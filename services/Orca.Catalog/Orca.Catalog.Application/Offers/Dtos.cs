namespace Orca.Catalog.Application.Offers;

public record OfferSummaryDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string[] Tags,
    bool Active);
public record OfferDetailsDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string[] Tags,
    bool Active,
    int? PublishedVersion,
    string? JsonSchema,
    string? UiSchema,
    string? ExecutionTemplate);
