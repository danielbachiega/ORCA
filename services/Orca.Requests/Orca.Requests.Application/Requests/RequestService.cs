using FluentValidation;
using Orca.Requests.Domain.Repositories;
using MassTransit;
using Orca.SharedContracts.Events;
using Microsoft.Extensions.Logging;

namespace Orca.Requests.Application.Requests;

public class RequestService : IRequestService
{
    private readonly IRequestRepository _repository;
    private readonly IValidator<CreateRequestDto> _createValidator;
    private readonly IValidator<UpdateRequestDto> _updateValidator;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<RequestService> _logger;

    public RequestService(
        IRequestRepository repository,
        IValidator<CreateRequestDto> createValidator,
        IValidator<UpdateRequestDto> updateValidator,
        IPublishEndpoint publishEndpoint,
        ILogger<RequestService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint)); 
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

        _logger.LogInformation("[MassTransit] Publicando RequestCreatedEvent para RequestId={RequestId}", created.Id);

        // ✨ PUBLICA EVENTO NO RABBITMQ
        await _publishEndpoint.Publish(new RequestCreatedEvent
        {
            RequestId = created.Id,
            OfferId = created.OfferId,
            FormDefinitionId = created.FormDefinitionId,
            ExecutionTargetType = created.ExecutionTargetType,
            ExecutionResourceType = created.ExecutionResourceType,
            ExecutionResourceId = created.ExecutionResourceId,
            UserId = created.UserId,
            FormData = created.FormData,
            CreatedAtUtc = created.CreatedAtUtc
        });

        _logger.LogInformation("[MassTransit] Evento publicado com sucesso para RequestId={RequestId}", created.Id);
        

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