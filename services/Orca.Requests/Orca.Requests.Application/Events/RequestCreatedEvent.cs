namespace Orca.Requests.Application.Events;

public record RequestCreatedEvent
{
    public Guid RequestId { get; init; }
    public Guid OfferId { get; init; }
    public Guid FormDefinitionId { get; init; }
    public string UserId { get; init; } = string.Empty;
    public string FormData { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
}