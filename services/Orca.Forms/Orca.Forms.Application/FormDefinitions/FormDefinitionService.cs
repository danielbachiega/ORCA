using FluentValidation;
using Orca.Forms.Domain.Repositories;

namespace Orca.Forms.Application.FormDefinitions;

public class FormDefinitionService : IFormDefinitionService
{
    private readonly IFormDefinitionRepository _repository;
    private readonly IValidator<CreateFormDefinitionDto> _createValidator;
    private readonly IValidator<UpdateFormDefinitionDto> _updateValidator;

    public FormDefinitionService(
        IFormDefinitionRepository repository,
        IValidator<CreateFormDefinitionDto> createValidator,
        IValidator<UpdateFormDefinitionDto> updateValidator)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    public async Task<IEnumerable<FormDefinitionSummaryDto>> GetAllAsync()
    {
        var items = await _repository.GetAllAsync();
        return items.Select(x => x.ToSummaryDto());
    }

    public async Task<FormDefinitionDetailsDto?> GetByIdAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        return entity?.ToDetailsDto();
    }

    public async Task<IEnumerable<FormDefinitionSummaryDto>> GetByOfferIdAsync(Guid offerId)
    {
        var items = await _repository.GetByOfferIdAsync(offerId);
        return items.Select(x => x.ToSummaryDto());
    }

    public async Task<FormDefinitionDetailsDto?> GetPublishedByOfferIdAsync(Guid offerId)
    {
        var entity = await _repository.GetPublishedByOfferIdAsync(offerId); // se adicionar no repo
        return entity?.ToDetailsDto();
    }

    public async Task<FormDefinitionDetailsDto> CreateAsync(CreateFormDefinitionDto dto)
    {
        await _createValidator.ValidateAndThrowAsync(dto);

        var entity = dto.ToEntity();
        var created = await _repository.CreateAsync(entity);
        return created.ToDetailsDto();
    }

    public async Task<FormDefinitionDetailsDto> UpdateAsync(UpdateFormDefinitionDto dto)
    {
        await _updateValidator.ValidateAndThrowAsync(dto);

        var entity = dto.ToEntity();
        var updated = await _repository.UpdateAsync(entity);
        return updated.ToDetailsDto();
    }

    public async Task DeleteAsync(Guid id) => await _repository.DeleteAsync(id);

    public async Task PublishAsync(Guid id) => await _repository.PublishAsync(id);
}