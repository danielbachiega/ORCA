using MassTransit;
using Orca.SharedContracts.Events;
using Orca.Orchestrator.Application.JobExecutions;
using Microsoft.Extensions.Logging;

namespace Orca.Orchestrator.Application.Consumers;

public class RequestCreatedEventConsumer : IConsumer<RequestCreatedEvent>
{
    private readonly IJobExecutionService _jobExecutionService;
    private readonly ILogger<RequestCreatedEventConsumer> _logger;

    public RequestCreatedEventConsumer(
        IJobExecutionService jobExecutionService,
        ILogger<RequestCreatedEventConsumer> logger)
    {
        _jobExecutionService = jobExecutionService ?? throw new ArgumentNullException(nameof(jobExecutionService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task Consume(ConsumeContext<RequestCreatedEvent> context)
    {
        var @event = context.Message;
        var correlationId = context.CorrelationId?.ToString()
            ?? context.Headers.Get<string>("X-Correlation-Id")
            ?? "(none)";

        _logger.LogInformation(
            "📨 RequestCreatedEvent consumido. RequestId={RequestId} TargetType={TargetType} CorrelationId={CorrelationId}",
            @event.RequestId, @event.ExecutionTargetType, correlationId);

        try
        {
            // 🆕 Cria registro de execução no banco
            var jobExecution = await _jobExecutionService.CreateJobExecutionAsync(
                @event.RequestId,
                @event.ExecutionTargetType,
                @event.ExecutionResourceType,
                @event.ExecutionResourceId,
                @event.FormData);

            _logger.LogInformation(
                "✅ JobExecution criada. Id={JobExecutionId} CorrelationId={CorrelationId}",
                jobExecution.Id, correlationId);

            // 🚀 Dispara para AWX/OO
            var (executionId, payload, response) = await _jobExecutionService.SendToAwxOoAsync(
                jobExecution,
                @event.FormData);

            if (string.IsNullOrWhiteSpace(executionId))
            {
                _logger.LogWarning(
                    "⚠️ Disparo não retornou ExecutionId. JobExecutionId={JobExecutionId} entrou em retry_pending. CorrelationId={CorrelationId}",
                    jobExecution.Id,
                    correlationId);
            }
            else
            {
                _logger.LogInformation(
                    "✅ Execução disparada com sucesso. ExecutionId={ExecutionId} CorrelationId={CorrelationId}",
                    executionId,
                    correlationId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Erro ao processar RequestCreatedEvent para RequestId={RequestId} (CorrelationId={CorrelationId})",
                @event.RequestId, correlationId);
            
            // NÃO relança exceção - RabbitMQ não fará retry
            // A execução fica como "pending" e será retentada pelo PollingWorker
        }
    }
}
