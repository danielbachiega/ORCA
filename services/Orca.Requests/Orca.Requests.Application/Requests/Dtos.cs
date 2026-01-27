namespace Orca.Requests.Application.Requests;

// DTOs de entrada
public class CreateRequestDto
{
    public Guid OfferId { get; set; }
    public Guid FormDefinitionId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FormData { get; set; } = string.Empty;  // JSON string
}

public class UpdateRequestDto
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public Guid FormDefinitionId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FormData { get; set; } = string.Empty;
    public int Status { get; set; }  // Enum como int
    public int? ResultType { get; set; }  // Opcional
    public string? AwxOoExecutionStatus { get; set; }
    public string? ExecutionId { get; set; }
    public string? ErrorMessage { get; set; }
}

// DTOs de saída
public class RequestSummaryDto
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public Guid FormDefinitionId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int Status { get; set; }
    public int? ResultType { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}

public class RequestDetailsDto
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public Guid FormDefinitionId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FormData { get; set; } = string.Empty;
    public int Status { get; set; }
    public int? ResultType { get; set; }
    public string? AwxOoExecutionStatus { get; set; }
    public string? ExecutionId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? ErrorMessage { get; set; }
}