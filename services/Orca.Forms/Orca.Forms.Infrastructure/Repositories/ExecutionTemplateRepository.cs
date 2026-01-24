#nullable enable

using Microsoft.EntityFrameworkCore;
using Orca.Forms.Domain.Entities;
using Orca.Forms.Domain.Repositories;

namespace Orca.Forms.Infrastructure.Repositories;

public class ExecutionTemplateRepository : IExecutionTemplateRepository
{
    private readonly FormsContext _context;

    public ExecutionTemplateRepository(FormsContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<ExecutionTemplate>> GetAllAsync()
    {
        return await _context.ExecutionTemplates
            .AsNoTracking()
            .OrderByDescending(et => et.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<ExecutionTemplate?> GetByIdAsync(Guid id)
    {
        return await _context.ExecutionTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(et => et.Id == id);
    }

    public async Task<ExecutionTemplate?> GetByFormDefinitionIdAsync(Guid formDefinitionId)
    {
        return await _context.ExecutionTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(et => et.FormDefinitionId == formDefinitionId);
    }

    public async Task<ExecutionTemplate> CreateAsync(ExecutionTemplate executionTemplate)
    {
        if (executionTemplate == null)
            throw new ArgumentNullException(nameof(executionTemplate));

        _context.ExecutionTemplates.Add(executionTemplate);
        await _context.SaveChangesAsync();
        return executionTemplate;
    }

    public async Task<ExecutionTemplate> UpdateAsync(ExecutionTemplate executionTemplate)
    {
        if (executionTemplate == null)
            throw new ArgumentNullException(nameof(executionTemplate));

        var existing = await _context.ExecutionTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(et => et.Id == executionTemplate.Id);

        if (existing == null)
            throw new InvalidOperationException($"ExecutionTemplate com ID {executionTemplate.Id} não encontrado");

        _context.ChangeTracker.Clear();
        _context.ExecutionTemplates.Update(executionTemplate);
        await _context.SaveChangesAsync();
        return executionTemplate;
    }

    public async Task DeleteAsync(Guid id)
    {
        var executionTemplate = await GetByIdAsync(id);
        if (executionTemplate == null)
            throw new InvalidOperationException($"ExecutionTemplate com ID {id} não encontrado");

        _context.ExecutionTemplates.Remove(executionTemplate);
        await _context.SaveChangesAsync();
    }
}