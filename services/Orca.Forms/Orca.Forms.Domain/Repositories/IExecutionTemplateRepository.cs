using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Domain.Repositories;

public interface IExecutionTemplateRepository
{
    Task<IEnumerable<ExecutionTemplate>> GetAllAsync();
    Task<ExecutionTemplate?> GetByIdAsync(Guid id);
    Task<ExecutionTemplate?> GetByFormDefinitionIdAsync(Guid formDefinitionId);
    Task<ExecutionTemplate> CreateAsync(ExecutionTemplate executionTemplate);
    Task<ExecutionTemplate> UpdateAsync(ExecutionTemplate executionTemplate);
    Task DeleteAsync(Guid id);
}