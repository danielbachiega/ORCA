namespace Orca.Orchestrator.Domain.Entities;

public class JobExecution
{
    // === Identificadores & Rastreamento ===
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequestId { get; set; }                    // FK conceitual do Requests Service
    
    // === Alvo & Recurso (do ExecutionTemplate capturado no evento) ===
    public int ExecutionTargetType { get; set; }          // 0=AWX, 1=OO
    public int? ExecutionResourceType { get; set; }       // 0=JobTemplate, 1=Workflow (null para OO)
    public string ExecutionResourceId { get; set; } = string.Empty;  // ID do job/workflow/flow
    
    // === Payload & Resposta (Auditoria) ===
    public string? ExecutionPayload { get; set; }         // JSON enviado para AWX/OO
    public string? ExecutionResponse { get; set; }        // JSON resposta do AWX/OO
    
    // === Status da Execução ===
    public string ExecutionStatus { get; set; } = "pending";  // pending, running, success, failed
    public string? AwxOoJobId { get; set; }                    // ID retornado pelo AWX (para polling)
    public string? AwxOoExecutionStatus { get; set; }     // Status raw do AWX/OO (para auditoria)
    
    // === Timestamps ===
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? SentToAwxOoAtUtc { get; set; }         // Quando foi disparado
    public DateTime? CompletedAtUtc { get; set; }         // Quando terminou
    
    // === Polling  de consulta de status ===
    public int PollingAttempts { get; set; } = 0;        // Contador (máx 1440 = 2h com 5s)
    public DateTime? LastPolledAtUtc { get; set; }        // Última vez que consultou status
    
    // === Retry do Launch ===
    public int LaunchAttempts { get; set; } = 0;
    public DateTime? NextLaunchAttemptAtUtc { get; set; }
    public string? LastLaunchError { get; set; }
    
    // === Erro ===
    public string? ErrorMessage { get; set; }


}