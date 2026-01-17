namespace Orca.Shared.Events;

public record OfferCreatedEvent(Guid OfferId, string Slug, string Name, string? Description);

public record OfferPublishedEvent(Guid OfferId, Guid VersionId, int VersionNumber);

public record RequestCreatedEvent(Guid RequestId, Guid OfferId, Guid VersionId, string RequesterSamAccount);

public record RequestApprovedEvent(Guid RequestId);

public record RequestExecutedEvent(Guid RequestId, string ExecutionStatus);
