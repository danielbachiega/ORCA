using System.Text.Json;

namespace Orca.Orchestrator.Application.JobExecutions.Dtos;

public class JobExecutionDetailsDto
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }
    
    // Execução
    public int ExecutionTargetType { get; set; }  // 0=AWX, 1=OO
    public string? AwxOoJobId { get; set; }
    public int ExecutionStatus { get; set; }      // 0=pending, 1=running, 2=success, 3=failed
    public string? ResultStatusType { get; set; } // Apenas OO (RESOLVED, DIAGNOSED, etc)
    
    // Polling
    public int PollingAttempts { get; set; }
    public int MaxPollingAttempts { get; set; } = 1440;  // 2h com 5s intervals
    public DateTime? LastPolledAtUtc { get; set; }
    
    // Dados
    public JsonElement? ExecutionPayload { get; set; }
    public JsonElement? ExecutionResponse { get; set; }
    public string? ErrorMessage { get; set; }
    
    // Timestamps
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}