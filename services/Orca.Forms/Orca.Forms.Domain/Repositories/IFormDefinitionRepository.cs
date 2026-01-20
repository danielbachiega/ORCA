using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Domain.Repositories;

public interface IFormDefinitionRepository
{
    Task<IEnumerable<FormDefinition>> GetAllAsync();
    Task<FormDefinition?> GetByIdAsync(Guid id);
    Task<IEnumerable<FormDefinition>> GetByOfferIdAsync(Guid offerId);
    Task<FormDefinition> CreateAsync(FormDefinition formDefinition);
    Task<FormDefinition> UpdateAsync(FormDefinition formDefinition);
    Task DeleteAsync(Guid id);
    Task PublishAsync(Guid formDefinitionId);
}
