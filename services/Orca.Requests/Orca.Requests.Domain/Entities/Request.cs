namespace Orca.Requests.Domain.Entities;

public class Request
{
    public Guid Id { get; set; } =  Guid.NewGuid();
    public Guid OfferId { get; set; }
    public Guid FormDefinitionId { get; set; }
    public int ExecutionTargetType { get; set; }          // 0=AWX, 1=OO (enum salvo como int no BD)
    public int? ExecutionResourceType { get; set; }       // 0=JobTemplate, 1=Workflow (null para OO)
    public string ExecutionResourceId { get; set; } = string.Empty; // ID ou UUID do job/workflow
    public string UserId { get; set; } = string.Empty;
    public string FormData { get; set; } = string.Empty; // JSONB com dados preenchidos
    public RequestStatus Status { get; set; } // Estado simplificado
    public ExecutionResultType? ResultType { get; set; } // APENAS para OO quando COMPLETED, opcional
    public string? AwxOoExecutionStatus { get; set; } // Status raw exato (para auditoria)
    public string? ExecutionId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? ErrorMessage { get; set; }

    public void MarkAsRunning(string executionId)
    {
        Status = RequestStatus.Running;
        ExecutionId = executionId;
        StartedAtUtc = DateTime.UtcNow;
    }

    public void MarkAsSuccess(string? awxOoStatus = null)
    {
        Status = RequestStatus.Success;
        CompletedAtUtc = DateTime.UtcNow;
        AwxOoExecutionStatus = awxOoStatus;
    }

    public void MarkAsFailed(string errorMessage, string? awxOoStatus = null)
    {
        Status = RequestStatus.Failed;
        CompletedAtUtc = DateTime.UtcNow;
        ErrorMessage = errorMessage;
        AwxOoExecutionStatus = awxOoStatus;
    }
}

public enum RequestStatus
{
    Pending = 0,    // new, pending, waiting (AWX) / PENDING_PAUSE, PENDING_CANCEL (OO)
    Running = 1,    // running (AWX/OO) / PAUSED (OO)
    Success = 2,    // successful (AWX) / COMPLETED (OO)
    Failed = 3      // failed, error, canceled (AWX) / SYSTEM_FAILURE, CANCELED (OO)
}

public enum ExecutionResultType
{
    // Apenas preenchido quando OO COMPLETED
    Success = 0,           // resultado sucesso (ou null/não preenchido)
    Diagnosed = 1,         // issue identificado
    NoActionTaken = 2      // nenhuma ação foi necessária
}

