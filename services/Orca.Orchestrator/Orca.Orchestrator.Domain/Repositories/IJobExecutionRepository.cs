namespace Orca.Orchestrator.Domain.Repositories;

using Orca.Orchestrator.Domain.Entities;

public interface IJobExecutionRepository
{
    Task<JobExecution> CreateAsync(JobExecution execution);
    Task<JobExecution?> GetByIdAsync(Guid id);
    Task<JobExecution?> GetByRequestIdAsync(Guid requestId);
    Task<JobExecution> UpdateAsync(JobExecution execution);
    Task<(List<JobExecution> items, int totalCount)> GetPagedAsync(int page, int pageSize);
    
    // Para o PollingWorker
    Task<IEnumerable<JobExecution>> GetPendingExecutionsAsync();  // status = "pending" ou "running"
}