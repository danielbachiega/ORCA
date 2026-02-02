namespace Orca.Orchestrator.Application.JobExecutions;

public class LaunchRetryOptions
{
    public int MaxAttempts { get; set; } = 5;
    public int BaseDelaySeconds { get; set; } = 5;
    public int MaxDelaySeconds { get; set; } = 120;
}