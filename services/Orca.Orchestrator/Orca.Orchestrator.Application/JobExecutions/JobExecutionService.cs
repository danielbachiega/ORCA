using System.Text.Json;
using MassTransit;
using Microsoft.Extensions.Logging;
using Orca.Orchestrator.Domain.Entities;
using Orca.Orchestrator.Domain.Repositories;
using Orca.Orchestrator.Application.Clients;
using Orca.Orchestrator.Application.Clients.Dtos;
using Orca.SharedContracts.Events;
using Microsoft.Extensions.Options;

namespace Orca.Orchestrator.Application.JobExecutions;

public class JobExecutionService : IJobExecutionService
{
    private readonly IJobExecutionRepository _repository;
    private readonly IAwxExecutionClient _awxClient;
    private readonly IOoExecutionClient _ooClient;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<JobExecutionService> _logger;
    private readonly LaunchRetryOptions _retryOptions;
    
    private const int MAX_POLLING_ATTEMPTS = 1440;  // 2h com 5s de intervalo

    public JobExecutionService(
        IJobExecutionRepository repository,
        IAwxExecutionClient awxClient,
        IOoExecutionClient ooClient,
        IPublishEndpoint publishEndpoint,
        ILogger<JobExecutionService> logger,
        IOptions<LaunchRetryOptions> retryOptions)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _awxClient = awxClient ?? throw new ArgumentNullException(nameof(awxClient));
        _ooClient = ooClient ?? throw new ArgumentNullException(nameof(ooClient));
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _retryOptions = retryOptions?.Value ?? throw new ArgumentNullException(nameof(retryOptions));
    }

    public async Task<JobExecution> CreateJobExecutionAsync(
        Guid requestId,
        int executionTargetType,
        int? executionResourceType,
        string executionResourceId,
        string formData)
    {
        _logger.LogInformation(
            "🆕 CreateJobExecutionAsync RequestId={RequestId} TargetType={TargetType}",
            requestId, executionTargetType);

        var execution = new JobExecution
        {
            RequestId = requestId,
            ExecutionTargetType = executionTargetType,
            ExecutionResourceType = executionResourceType,
            ExecutionResourceId = executionResourceId,
            ExecutionStatus = "pending"
        };

        var created = await _repository.CreateAsync(execution);
        _logger.LogInformation("✅ JobExecution criada com ID={JobExecutionId}", created.Id);
        return created;
    }

    public async Task<(string executionId, string payload, string response)> SendToAwxOoAsync(
        JobExecution jobExecution,
        string formData)
    {
        _logger.LogInformation(
            "📤 SendToAwxOoAsync JobExecutionId={JobExecutionId} TargetType={TargetType}",
            jobExecution.Id, jobExecution.ExecutionTargetType);
        var payload = string.Empty;

        try
        {
            // 🔧 Prepara payload baseado no alvo
            payload = jobExecution.ExecutionTargetType == 0
                ? PrepareAwxPayload(formData, jobExecution.ExecutionResourceType, jobExecution.ExecutionResourceId)
                : PrepareOoPayload(formData, jobExecution.ExecutionResourceId);

            _logger.LogInformation("📦 Payload preparado: {Payload}", payload);

            // Salva payload para auditoria
            jobExecution.ExecutionPayload = payload;
            await _repository.UpdateAsync(jobExecution);

            // ✅ Seleciona cliente correto
            IExecutionClient client = jobExecution.ExecutionTargetType == 0
                ? _awxClient
                : _ooClient;

            // 🚀 Dispara execução
            var executionId = await client.LaunchAsync(payload);
            
            // 📨 Gera resposta fake (será melhorado depois)
            var response = $"{{\"executionId\": \"{executionId}\", \"status\": \"pending\"}}";

            _logger.LogInformation(
                "✅ SendToAwxOoAsync sucesso. ExecutionId={ExecutionId}",
                executionId);

            //  Salva o executionId na entidade para polling posterior
            jobExecution.AwxOoJobId = executionId;
            jobExecution.ExecutionResponse = response;
            jobExecution.ExecutionStatus = "running";
            jobExecution.SentToAwxOoAtUtc = DateTime.UtcNow;
            await _repository.UpdateAsync(jobExecution);

            return (executionId, payload, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ SendToAwxOoAsync erro para JobExecutionId={JobExecutionId}",
                jobExecution.Id);

            jobExecution.LaunchAttempts++;
            jobExecution.LastLaunchError = ex.Message;

            // Calcula delay com backoff exponencial
            var delaySeconds = Math.Min(
                _retryOptions.BaseDelaySeconds * Math.Pow(2, jobExecution.LaunchAttempts - 1),
                _retryOptions.MaxDelaySeconds);
            
            jobExecution.NextLaunchAttemptAtUtc = DateTime.UtcNow.AddSeconds(delaySeconds);
            jobExecution.ExecutionStatus = "retry_pending";
            
            if (!string.IsNullOrWhiteSpace(payload))
            {
                jobExecution.ExecutionPayload = payload;
            }

            _logger.LogWarning(
                "🔄 Agendando retry {Attempt}/{Max} para JobExecutionId={JobExecutionId} em {Delay}s",
                jobExecution.LaunchAttempts, _retryOptions.MaxAttempts, jobExecution.Id, delaySeconds);

            await _repository.UpdateAsync(jobExecution);
            
            // NÃO publica evento ainda (vai tentar de novo)
            // NÃO faz throw (para não quebrar o consumer)
            return (string.Empty, payload, string.Empty);
        }
    }

    public async Task ProcessPendingExecutionsAsync()
    {
        _logger.LogInformation("⏳ ProcessPendingExecutionsAsync iniciado");

        var pending = await _repository.GetPendingExecutionsAsync();
        _logger.LogInformation("📊 Encontradas {Count} execuções pendentes/rodando", pending.Count());

        foreach (var execution in pending)
        {
            // ⏱️ Respeita intervalo de polling (5 segundos)
            if (execution.LastPolledAtUtc.HasValue 
                && (DateTime.UtcNow - execution.LastPolledAtUtc.Value).TotalSeconds < 5)
            {
                _logger.LogDebug(
                    "⏭️ Pulando JobExecutionId={JobExecutionId} (último polling foi há menos de 5s)",
                    execution.Id);
                continue;
            }
            // 🔄 Lógica de RETRY do Launch
            if (execution.ExecutionStatus == "retry_pending")
            {
                if (execution.LaunchAttempts >= _retryOptions.MaxAttempts)
                {
                    _logger.LogWarning(
                        "⏹️ JobExecutionId={JobExecutionId} excedeu limite de relançamento ({Attempts})",
                        execution.Id, execution.LaunchAttempts);

                    execution.ExecutionStatus = "failed";
                    execution.ErrorMessage = $"Falha ao disparar após {execution.LaunchAttempts} tentativas";
                    execution.CompletedAtUtc = DateTime.UtcNow;
                    await _repository.UpdateAsync(execution);
                    await PublishStatusUpdateAsync(execution, "failed", null);
                    continue;
                }

                if (execution.NextLaunchAttemptAtUtc.HasValue &&
                    execution.NextLaunchAttemptAtUtc.Value > DateTime.UtcNow)
                {
                    _logger.LogDebug(
                        "⏭️ JobExecutionId={JobExecutionId} aguardando próxima tentativa em {NextAttempt}",
                        execution.Id, execution.NextLaunchAttemptAtUtc.Value);
                    continue;
                }

                _logger.LogInformation(
                    "🔄 Relançando JobExecutionId={JobExecutionId} (tentativa {Attempt})",
                    execution.Id, execution.LaunchAttempts + 1);

                try
                {
                    await SendToAwxOoAsync(execution, execution.ExecutionPayload ?? "{}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Falha ao relançar JobExecutionId={JobExecutionId}", execution.Id);
                }
                continue;
            }
            // ⚠️ Verifica limite de tentativas (2h = 1440 tentativas)
            if (execution.PollingAttempts >= MAX_POLLING_ATTEMPTS)
            {
                _logger.LogWarning(
                    "⏹️ JobExecutionId={JobExecutionId} excedeu limite de polling ({Attempts})",
                    execution.Id, execution.PollingAttempts);

                execution.ExecutionStatus = "failed";
                execution.ErrorMessage = "Polling timeout (2h excedido)";
                execution.CompletedAtUtc = DateTime.UtcNow;
                await _repository.UpdateAsync(execution);

                // 📨 Publica erro
                await PublishStatusUpdateAsync(execution, "failed", null);
                continue;
            }

            if (string.IsNullOrWhiteSpace(execution.AwxOoJobId))
            {
                _logger.LogWarning(
                    "⚠️ JobExecutionId={JobExecutionId} sem ExecutionId para polling",
                    execution.Id);

                execution.ExecutionStatus = "failed";
                execution.ErrorMessage = "Sem ExecutionId para polling (falha no disparo)";
                execution.CompletedAtUtc = DateTime.UtcNow;
                await _repository.UpdateAsync(execution);

                await PublishStatusUpdateAsync(execution, "failed", null);
                continue;
            }

            try
            {
                // 🔍 Consulta status no AWX/OO
                IExecutionClient client = execution.ExecutionTargetType == 0
                    ? _awxClient
                    : _ooClient;
                var status = await client.GetStatusAsync(execution.AwxOoJobId.ToString());

                _logger.LogInformation(
                    "📊 Polling JobExecutionId={JobExecutionId} Status={Status}",
                    execution.Id, status);

                execution.LastPolledAtUtc = DateTime.UtcNow;
                execution.PollingAttempts++;
                execution.AwxOoExecutionStatus = status;

                // 🎯 Processa resultado baseado no status
                await HandleExecutionStatusAsync(execution, client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "❌ Erro durante polling JobExecutionId={JobExecutionId}",
                    execution.Id);
                execution.PollingAttempts++;
                await _repository.UpdateAsync(execution);
            }
        }

        _logger.LogInformation("✅ ProcessPendingExecutionsAsync finalizado");
    }

    private async Task HandleExecutionStatusAsync(JobExecution execution, IExecutionClient client)
    {
        var status = execution.AwxOoExecutionStatus ?? "unknown";

        // ✅ AWX statuses: new, pending, waiting, running, successful, failed, error, canceled
        // ✅ OO statuses: RUNNING, COMPLETED, SYSTEM_FAILURE, PAUSED, PENDING_PAUSE, CANCELED, PENDING_CANCEL

        if (status == "running" || status == "RUNNING" || status == "pending" || status == "waiting")
        {
            // Ainda rodando
            await _repository.UpdateAsync(execution);
            return;
        }

        if (status == "successful" || status == "COMPLETED")
        {
            execution.ExecutionStatus = "success";
            execution.CompletedAtUtc = DateTime.UtcNow;
            await _repository.UpdateAsync(execution);

            // Para OO, consulta ResultStatusType
            if (execution.ExecutionTargetType == 1)  // OO
            {
                var resultType = await client.GetResultStatusTypeAsync(
                    execution.AwxOoJobId!.ToString());
                
                // Mapeia OO resultType para ExecutionResultType
                var mappedResultType = MapOoResultType(resultType);
                await PublishStatusUpdateAsync(execution, "success", mappedResultType);
            }
            else
            {
                // AWX: sucesso simples (sem ResultStatusType)
                await PublishStatusUpdateAsync(execution, "success", null);
            }
            return;
        }

        if (status == "failed" || status == "error" || status == "SYSTEM_FAILURE" || status == "canceled")
        {
            execution.ExecutionStatus = "failed";
            execution.CompletedAtUtc = DateTime.UtcNow;
            execution.ErrorMessage = $"Execução falhou com status: {status}";
            await _repository.UpdateAsync(execution);

            await PublishStatusUpdateAsync(execution, "failed", null);
            return;
        }

        // Status desconhecido
        _logger.LogWarning(
            "⚠️ JobExecutionId={JobExecutionId} Status desconhecido: {Status}",
            execution.Id, status);
        await _repository.UpdateAsync(execution);
    }

    private async Task PublishStatusUpdateAsync(
        JobExecution execution,
        string status,
        int? resultType)
    {
        _logger.LogInformation(
            "📨 PublishStatusUpdateAsync RequestId={RequestId} Status={Status}",
            execution.RequestId, status);

        var requestStatus = status switch
        {
            "running" => 1,  // Running
            "success" => 2,  // Success
            "failed" => 3,   // Failed
            _ => 0           // Pending
        };

        await _publishEndpoint.Publish(new RequestStatusUpdatedEvent
        {
            RequestId = execution.RequestId,
            Status = requestStatus,
            ResultType = resultType,
            AwxOoExecutionStatus = execution.AwxOoExecutionStatus,
            ExecutionId = execution.AwxOoJobId?.ToString(),
            ErrorMessage = execution.ErrorMessage,
            UpdatedAtUtc = DateTime.UtcNow
        });

        _logger.LogInformation("✅ Evento publicado para RequestId={RequestId}", execution.RequestId);
    }

    public async Task<JobExecution?> GetJobExecutionAsync(Guid jobExecutionId)
    {
        return await _repository.GetByIdAsync(jobExecutionId);
    }

    public async Task<JobExecution?> GetJobExecutionByRequestIdAsync(Guid requestId)
    {
        return await _repository.GetByRequestIdAsync(requestId);
    }

    // ============================================
    // HELPERS PRIVADOS
    // ============================================

    private string PrepareAwxPayload(string formData, int? resourceType, string resourceId)
    {
        _logger.LogInformation("🔧 PrepareAwxPayload com FormData: {FormData}", formData);

        var formDataObj = JsonDocument.Parse(formData).RootElement;

        // Se já estiver no formato esperado do AWX, não reembrulhar
        if (formDataObj.ValueKind == JsonValueKind.Object
            && formDataObj.TryGetProperty("resourceId", out _)
            && formDataObj.TryGetProperty("launch", out _))
        {
            _logger.LogInformation("ℹ️ FormData já está no formato AWX, usando payload original");
            return formData;
        }

        var extraVars = new Dictionary<string, object>();

        // Copia todos os campos do FormData para extra_vars
        foreach (var prop in formDataObj.EnumerateObject())
        {
            extraVars[prop.Name] = JsonSerializer.Deserialize<object>(prop.Value.GetRawText())!;
        }

        var launchPayload = new AwxLaunchRequest
        {
            ExtraVars = extraVars
        };

        var wrapper = new
        {
            resourceId,
            resourceType,
            launch = launchPayload
        };

        var json = JsonSerializer.Serialize(wrapper, new JsonSerializerOptions { WriteIndented = false });
        _logger.LogInformation("✅ AwxPayload preparado: {Payload}", json);
        return json;
    }

    private string PrepareOoPayload(string formData, string flowUuid)
    {
        _logger.LogInformation("🔧 PrepareOoPayload com FormData: {FormData}", formData);

        var formDataObj = JsonDocument.Parse(formData).RootElement;

        // Se já estiver no formato esperado do OO, não reembrulhar
        if (formDataObj.ValueKind == JsonValueKind.Object
            && formDataObj.TryGetProperty("flowUuid", out _)
            && formDataObj.TryGetProperty("inputs", out _))
        {
            _logger.LogInformation("ℹ️ FormData já está no formato OO, usando payload original");
            return formData;
        }

        var inputs = new Dictionary<string, object>();

        // Copia todos os campos do FormData para inputs
        foreach (var prop in formDataObj.EnumerateObject())
        {
            inputs[prop.Name] = JsonSerializer.Deserialize<object>(prop.Value.GetRawText())!;
        }

        var payload = new OoExecutionRequest
        {
            FlowUuid = flowUuid,
            Inputs = inputs
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
        _logger.LogInformation("✅ OoPayload preparado: {Payload}", json);
        return json;
    }

    private int? MapOoResultType(string? ooResultType)
    {
        return ooResultType switch
        {
            "RESOLVED" => 0,           // Success
            "DIAGNOSED" => 1,          // Diagnosed
            "NO_ACTION_TAKEN" => 2,    // NoActionTaken
            "ERROR" => null,           // Mapeado como null (erro genérico)
            _ => null
        };
    }
}