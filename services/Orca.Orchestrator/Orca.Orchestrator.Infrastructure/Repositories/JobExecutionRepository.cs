#nullable enable

using Microsoft.EntityFrameworkCore;
using Orca.Orchestrator.Domain.Entities;
using Orca.Orchestrator.Domain.Repositories;

namespace Orca.Orchestrator.Infrastructure.Repositories;

public class JobExecutionRepository : IJobExecutionRepository
{
    private readonly OrchestratorContext _context;

    public JobExecutionRepository(OrchestratorContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<JobExecution> CreateAsync(JobExecution execution)
    {
        if (execution == null)
            throw new ArgumentNullException(nameof(execution));

        _context.JobExecutions.Add(execution);
        await _context.SaveChangesAsync();
        return execution;
    }

    public async Task<JobExecution?> GetByIdAsync(Guid id)
    {
        return await _context.JobExecutions
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == id);
    }

    public async Task<JobExecution?> GetByRequestIdAsync(Guid requestId)
    {
        return await _context.JobExecutions
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.RequestId == requestId);
    }

    public async Task<JobExecution> UpdateAsync(JobExecution execution)
    {
        if (execution == null)
            throw new ArgumentNullException(nameof(execution));

        var existing = await _context.JobExecutions
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == execution.Id);

        if (existing == null)
            throw new InvalidOperationException($"JobExecution com ID {execution.Id} não encontrada");

        _context.ChangeTracker.Clear();
        _context.JobExecutions.Update(execution);
        await _context.SaveChangesAsync();
        return execution;
    }

    public async Task<IEnumerable<JobExecution>> GetPendingExecutionsAsync()
    {
        return await _context.JobExecutions
            .AsNoTracking()
            .Where(j =>
                j.ExecutionStatus == "pending" ||
                j.ExecutionStatus == "running" ||
                j.ExecutionStatus == "retry_pending")
            .OrderBy(j => j.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<(List<JobExecution> items, int totalCount)> GetPagedAsync(int page, int pageSize)
    {
        var query = _context.JobExecutions.AsNoTracking();
        var total = await query.CountAsync();
        
        var items = await query
            .OrderByDescending(j => j.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }
}