namespace Orca.Forms.Application.FormDefinitions;

public interface IFormDefinitionService
{
    // Consultas (retornam DTOs, não entidades)
    Task<IEnumerable<FormDefinitionSummaryDto>> GetAllAsync();
    Task<FormDefinitionDetailsDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<FormDefinitionSummaryDto>> GetByOfferIdAsync(Guid offerId);
    Task<FormDefinitionDetailsDto?> GetPublishedByOfferIdAsync(Guid offerId);
    
    // Comandos (recebem DTOs de entrada, retornam DTOs de saída)
    Task<FormDefinitionDetailsDto> CreateAsync(CreateFormDefinitionDto dto);
    Task<FormDefinitionDetailsDto> UpdateAsync(UpdateFormDefinitionDto dto);
    Task DeleteAsync(Guid id);
    Task PublishAsync(Guid id);
}