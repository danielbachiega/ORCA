using FluentValidation;
using Orca.Requests.Domain.Repositories;
using MassTransit;
using Orca.SharedContracts.Events;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace Orca.Requests.Application.Requests;

public class RequestService : IRequestService
{
    private readonly IRequestRepository _repository;
    private readonly IValidator<CreateRequestDto> _createValidator;
    private readonly IValidator<UpdateRequestDto> _updateValidator;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<RequestService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RequestService(
        IRequestRepository repository,
        IValidator<CreateRequestDto> createValidator,
        IValidator<UpdateRequestDto> updateValidator,
        IPublishEndpoint publishEndpoint,
        ILogger<RequestService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _createValidator = createValidator ?? throw new ArgumentNullException(nameof(createValidator));
        _updateValidator = updateValidator ?? throw new ArgumentNullException(nameof(updateValidator));
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint)); 
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
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

        var httpContext = _httpContextAccessor.HttpContext;

        var correlationIdText = httpContext?.Request.Headers["X-Correlation-Id"].ToString();
        if (string.IsNullOrWhiteSpace(correlationIdText))
        {
            correlationIdText = httpContext?.Response.Headers["X-Correlation-Id"].ToString();
        }

        if (string.IsNullOrWhiteSpace(correlationIdText))
        {
            correlationIdText = created.Id.ToString("N");
        }

        var parsedCorrelationId = Guid.TryParse(correlationIdText, out var correlationGuid)
            ? correlationGuid
            : created.Id;

        _logger.LogInformation(
            "[MassTransit] Publicando RequestCreatedEvent para RequestId={RequestId} CorrelationId={CorrelationId}",
            created.Id,
            correlationIdText);

        // ✨ PUBLICA EVENTO NO RABBITMQ
        await _publishEndpoint.Publish(new RequestCreatedEvent
        {
            RequestId = created.Id,
            OfferId = created.OfferId,
            OfferName = created.OfferName,
            FormDefinitionId = created.FormDefinitionId,
            ExecutionTargetType = created.ExecutionTargetType,
            ExecutionResourceType = created.ExecutionResourceType,
            ExecutionResourceId = created.ExecutionResourceId,
            UserId = created.UserId,
            FormData = created.FormData,
            CreatedAtUtc = created.CreatedAtUtc
        }, publishContext =>
        {
            publishContext.CorrelationId = parsedCorrelationId;
            publishContext.Headers.Set("X-Correlation-Id", correlationIdText);
        });

        _logger.LogInformation(
            "[MassTransit] Evento publicado com sucesso para RequestId={RequestId} CorrelationId={CorrelationId}",
            created.Id,
            correlationIdText);
        

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

    public async Task UpdateStatusAsync(
        Guid requestId,
        int status,
        string? executionId = null,
        string? awxOoExecutionStatus = null,
        int? resultType = null,
        string? errorMessage = null,
        DateTime? completedAtUtc = null)
    {
        var request = await _repository.GetByIdAsync(requestId);
        
        if (request == null)
        {
            _logger.LogWarning("Request {RequestId} não encontrada para atualizar status", requestId);
            return;
        }

        // Mapear status int → enum
        request.Status = (Domain.Entities.RequestStatus)status;
        request.ExecutionId = executionId ?? request.ExecutionId;
        request.AwxOoExecutionStatus = awxOoExecutionStatus ?? request.AwxOoExecutionStatus;
        request.ResultType = resultType.HasValue
            ? (Domain.Entities.ExecutionResultType?)resultType.Value
            : request.ResultType;
        request.ErrorMessage = errorMessage;

        // Atualizar timestamps baseado no status
        if (status == 1) // Running
        {
            request.StartedAtUtc ??= DateTime.UtcNow;
        }
        else if (status == 2 || status == 3) // Success ou Failed
        {
            request.CompletedAtUtc = completedAtUtc ?? DateTime.UtcNow;
        }

        await _repository.UpdateAsync(request);
        
        _logger.LogInformation("Request {RequestId} atualizada para Status {Status}", requestId, status);
    }}