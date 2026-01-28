using MassTransit;
using Orca.SharedContracts.Events;
using Orca.Requests.Application.Requests;
using Orca.Requests.Domain.Repositories;
using Microsoft.Extensions.Logging;

namespace Orca.Requests.Application.Consumers;

public class RequestStatusUpdatedConsumer : IConsumer<RequestStatusUpdatedEvent>
{
    private readonly IRequestRepository _repository;
    private readonly ILogger<RequestStatusUpdatedConsumer> _logger;

    public RequestStatusUpdatedConsumer(
        IRequestRepository repository,
        ILogger<RequestStatusUpdatedConsumer> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task Consume(ConsumeContext<RequestStatusUpdatedEvent> context)
    {
        var message = context.Message;
        
        _logger.LogInformation(
            "Recebido evento RequestStatusUpdated para Request {RequestId} com Status {Status}",
            message.RequestId, message.Status);

        try
        {
            // Busca a request existente
            var request = await _repository.GetByIdAsync(message.RequestId);
            
            if (request == null)
            {
                _logger.LogWarning("Request {RequestId} não encontrada", message.RequestId);
                return;
            }

            // Atualiza os campos baseado no evento
            request.Status = (Orca.Requests.Domain.Entities.RequestStatus)message.Status;
            request.ResultType = message.ResultType.HasValue 
                ? (Orca.Requests.Domain.Entities.ExecutionResultType)message.ResultType 
                : null;
            request.AwxOoExecutionStatus = message.AwxOoExecutionStatus;
            request.ExecutionId = message.ExecutionId;
            request.ErrorMessage = message.ErrorMessage;

            // Atualiza timestamps baseado no status
            if (message.Status == 1) // Running
            {
                request.StartedAtUtc = message.UpdatedAtUtc;
            }
            else if (message.Status == 2 || message.Status == 3) // Success ou Failed
            {
                request.CompletedAtUtc = message.UpdatedAtUtc;
            }

            // Salva no banco
            await _repository.UpdateAsync(request);
            
            _logger.LogInformation(
                "Request {RequestId} atualizada com sucesso para Status {Status}",
                message.RequestId, message.Status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar RequestStatusUpdatedEvent para Request {RequestId}", message.RequestId);
            throw; // MassTransit vai fazer retry automático
        }
    }
}