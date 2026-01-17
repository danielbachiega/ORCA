namespace Orca.Shared.Contracts;

public record CreateOfferRequest(string Slug, string Name, string? Description, string[] Tags);

public record UpdateOfferRequest(string Name, string? Description, string[] Tags, bool Active);

public record PublishOfferVersionRequest(Guid VersionId);

public record CreateRequestRequest(Guid OfferId, Guid VersionId, string? FormPayload);

public record UserIdentityDto(string SamAccountName, string DisplayName, string[] Groups);
