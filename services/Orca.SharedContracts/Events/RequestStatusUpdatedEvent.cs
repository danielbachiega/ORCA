namespace Orca.SharedContracts.Events;

public record RequestStatusUpdatedEvent
{
    public Guid RequestId { get; init; }
    public int Status { get; init; }
    public int? ResultType { get; init; }
    public string? AwxOoExecutionStatus { get; init; }
    public string? ExecutionId { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime UpdatedAtUtc { get; init; }
}
