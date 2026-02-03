using FluentValidation;
using Orca.Forms.Domain.Repositories;

namespace Orca.Forms.Application.ExecutionTemplates;

public class ExecutionTemplateService : IExecutionTemplateService
{
    private readonly IExecutionTemplateRepository _repository;
    private readonly IValidator<CreateExecutionTemplateDto> _createValidator;
    private readonly IValidator<UpdateExecutionTemplateDto> _updateValidator;

    public ExecutionTemplateService(
        IExecutionTemplateRepository repository,
        IValidator<CreateExecutionTemplateDto> createValidator,
        IValidator<UpdateExecutionTemplateDto> updateValidator)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    public async Task<IEnumerable<ExecutionTemplateSummaryDto>> GetAllAsync()
    {
        var items = await _repository.GetAllAsync();
        return items.Select(x => x.ToSummaryDto());
    }

    public async Task<ExecutionTemplateDetailsDto?> GetByIdAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        return entity?.ToDetailsDto();
    }

    public async Task<ExecutionTemplateDetailsDto?> GetByFormDefinitionIdAsync(Guid formDefinitionId)
    {
        var entity = await _repository.GetByFormDefinitionIdAsync(formDefinitionId);
        return entity?.ToDetailsDto();
    }

    public async Task<ExecutionTemplateDetailsDto> CreateAsync(CreateExecutionTemplateDto dto)
    {
        await _createValidator.ValidateAndThrowAsync(dto);

        var entity = dto.ToEntity();
        var created = await _repository.CreateAsync(entity);
        return created.ToDetailsDto();
    }

    public async Task<ExecutionTemplateDetailsDto> UpdateAsync(UpdateExecutionTemplateDto dto)
    {
        await _updateValidator.ValidateAndThrowAsync(dto);

        var entity = dto.ToEntity();
        var updated = await _repository.UpdateAsync(entity);
        return updated.ToDetailsDto();
    }

    public async Task DeleteAsync(Guid id)
    {
        await _repository.DeleteAsync(id);
    }
}