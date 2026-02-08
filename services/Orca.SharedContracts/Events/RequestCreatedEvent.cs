namespace Orca.SharedContracts.Events;

public record RequestCreatedEvent
{
    public Guid RequestId { get; init; }
    public Guid OfferId { get; init; }
    public string OfferName { get; init; } = string.Empty;
    public Guid FormDefinitionId { get; init; }
    public int ExecutionTargetType { get; init; }
    public int? ExecutionResourceType { get; init; }
    public string ExecutionResourceId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string FormData { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
}
