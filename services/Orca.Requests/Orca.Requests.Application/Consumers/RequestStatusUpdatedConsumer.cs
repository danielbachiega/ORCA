using MassTransit;
using Orca.SharedContracts.Events;
using Orca.Requests.Application.Requests;
using Microsoft.Extensions.Logging;

namespace Orca.Requests.Application.Consumers;

public class RequestStatusUpdatedConsumer : IConsumer<RequestStatusUpdatedEvent>
{
    private readonly IRequestService _requestService;
    private readonly ILogger<RequestStatusUpdatedConsumer> _logger;

    public RequestStatusUpdatedConsumer(
        IRequestService requestService,
        ILogger<RequestStatusUpdatedConsumer> logger)
    {
        _requestService = requestService ?? throw new ArgumentNullException(nameof(requestService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task Consume(ConsumeContext<RequestStatusUpdatedEvent> context)
    {
        var message = context.Message;
        var correlationId = context.CorrelationId?.ToString()
            ?? context.Headers.Get<string>("X-Correlation-Id")
            ?? "(none)";
        
        _logger.LogInformation(
            "📨 RequestStatusUpdatedConsumer recebeu evento: RequestId={RequestId}, Status={Status}, CorrelationId={CorrelationId}",
            message.RequestId, message.Status, correlationId);

        try
        {
            // Atualizar status do Request via Service
            await _requestService.UpdateStatusAsync(
                requestId: message.RequestId,
                status: message.Status,
                executionId: message.ExecutionId,
                awxOoExecutionStatus: message.AwxOoExecutionStatus,
                resultType: message.ResultType,
                errorMessage: message.ErrorMessage,
                completedAtUtc: message.Status == 2 || message.Status == 3 
                    ? message.UpdatedAtUtc 
                    : null
            );

            _logger.LogInformation(
                "✅ Request {RequestId} atualizado para status {Status} (CorrelationId={CorrelationId})",
                message.RequestId, message.Status, correlationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Erro ao processar RequestStatusUpdatedEvent para RequestId={RequestId} (CorrelationId={CorrelationId})",
                message.RequestId, correlationId);
            
            // Não relançar - permitir que mensagem seja marcada como processada
            // (evita loop infinito se o Request não existir)
        }
    }
}
