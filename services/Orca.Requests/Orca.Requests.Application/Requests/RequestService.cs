using FluentValidation;
using Orca.Requests.Domain.Repositories;

namespace Orca.Requests.Application.Requests;

public class RequestService : IRequestService
{
    private readonly IRequestRepository _repository;
    private readonly IValidator<CreateRequestDto> _createValidator;
    private readonly IValidator<UpdateRequestDto> _updateValidator;

    public RequestService(
        IRequestRepository repository,
        IValidator<CreateRequestDto> createValidator,
        IValidator<UpdateRequestDto> updateValidator)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
    }

    public async Task<IEnumerable<RequestSummaryDto>> GetAllAsync()
    {
        var items = await _repository.GetAllAsync();
        return items.Select(x => x.ToSummaryDto());
    }

    public async Task<IEnumerable<RequestSummaryDto>> GetByUserAndOfferAsync(string userId, Guid offerId)
    {
        var items = await _repository.GetByUserAndOfferAsync(userId, offerId);
        return items.Select(x => x.ToSummaryDto());
    }

    public async Task<RequestDetailsDto?> GetByIdAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        return entity?.ToDetailsDto();
    }

    public async Task<IEnumerable<RequestSummaryDto>> GetByOfferIdAsync(Guid offerId)
    {
        var items = await _repository.GetByOfferIdAsync(offerId);
        return items.Select(x => x.ToSummaryDto());
    }

    public async Task<IEnumerable<RequestSummaryDto>> GetByUserIdAsync(string userId)
    {
        var items = await _repository.GetByUserIdAsync(userId);
        return items.Select(x => x.ToSummaryDto());
    }

    public async Task<RequestDetailsDto> CreateAsync(CreateRequestDto dto)
    {
        await _createValidator.ValidateAndThrowAsync(dto);

        var entity = dto.ToEntity();
        var created = await _repository.CreateAsync(entity);
        return created.ToDetailsDto();
    }

    public async Task<RequestDetailsDto> UpdateAsync(UpdateRequestDto dto)
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