namespace Orca.Orchestrator.Application.JobExecutions.Dtos;

public class JobExecutionListItemDto
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }
    
    public int ExecutionTargetType { get; set; }  // 0=AWX, 1=OO
    public string? AwxOoJobId { get; set; }
    public int ExecutionStatus { get; set; }
    
    public int PollingAttempts { get; set; }
    public DateTime? LastPolledAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}