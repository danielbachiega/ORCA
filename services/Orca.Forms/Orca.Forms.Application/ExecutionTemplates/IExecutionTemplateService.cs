namespace Orca.Forms.Application.ExecutionTemplates;

public interface IExecutionTemplateService
{
    Task<IEnumerable<ExecutionTemplateSummaryDto>> GetAllAsync();
    Task<ExecutionTemplateDetailsDto?> GetByIdAsync(Guid id);
    Task<ExecutionTemplateDetailsDto?> GetByFormDefinitionIdAsync(Guid formDefinitionId);
    Task<ExecutionTemplateDetailsDto> CreateAsync(CreateExecutionTemplateDto dto);
    Task<ExecutionTemplateDetailsDto> UpdateAsync(UpdateExecutionTemplateDto dto);
    Task DeleteAsync(Guid id);
}