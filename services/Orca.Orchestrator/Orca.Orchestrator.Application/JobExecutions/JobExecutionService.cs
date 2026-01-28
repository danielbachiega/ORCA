using System.Text.Json;
using MassTransit;
using Microsoft.Extensions.Logging;
using Orca.Orchestrator.Domain.Entities;
using Orca.Orchestrator.Domain.Repositories;
using Orca.Orchestrator.Application.Clients;
using Orca.Orchestrator.Application.Clients.Dtos;
using Orca.SharedContracts.Events;

namespace Orca.Orchestrator.Application.JobExecutions;

public class JobExecutionService : IJobExecutionService
{
    private readonly IJobExecutionRepository _repository;
    private readonly IExecutionClient _awxClient;
    private readonly IExecutionClient _ooClient;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<JobExecutionService> _logger;
    
    private const int MAX_POLLING_ATTEMPTS = 1440;  // 2h com 5s de intervalo

    public JobExecutionService(
        IJobExecutionRepository repository,
        IExecutionClient awxClient,
        IExecutionClient ooClient,
        IPublishEndpoint publishEndpoint,
        ILogger<JobExecutionService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _awxClient = awxClient ?? throw new ArgumentNullException(nameof(awxClient));
        _ooClient = ooClient ?? throw new ArgumentNullException(nameof(ooClient));
        _publishEndpoint = publishEndpoint ?? throw new ArgumentNullException(nameof(publishEndpoint));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

        try
        {
            // 🔧 Prepara payload baseado no alvo
            var payload = jobExecution.ExecutionTargetType == 0
                ? PrepareAwxPayload(formData, jobExecution.ExecutionResourceType)
                : PrepareOoPayload(formData, jobExecution.ExecutionResourceId);

            _logger.LogInformation("📦 Payload preparado: {Payload}", payload);

            // ✅ Seleciona cliente correto
            var client = jobExecution.ExecutionTargetType == 0 ? _awxClient : _ooClient;

            // 🚀 Dispara execução
            var executionId = await client.LaunchAsync(payload);
            
            // 📨 Gera resposta fake (será melhorado depois)
            var response = $"{{\"executionId\": \"{executionId}\", \"status\": \"pending\"}}";

            _logger.LogInformation(
                "✅ SendToAwxOoAsync sucesso. ExecutionId={ExecutionId}",
                executionId);

            //  Salva o executionId na entidade para polling posterior
            jobExecution.AwxOoJobId = executionId;
            await _repository.UpdateAsync(jobExecution);

            return (executionId, payload, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ SendToAwxOoAsync erro para JobExecutionId={JobExecutionId}",
                jobExecution.Id);
            throw;
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

            try
            {
                // 🔍 Consulta status no AWX/OO
                var client = execution.ExecutionTargetType == 0 ? _awxClient : _ooClient;
                var status = await client.GetStatusAsync(execution.AwxOoJobId!.ToString());

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

    private string PrepareAwxPayload(string formData, int? resourceType)
    {
        _logger.LogInformation("🔧 PrepareAwxPayload com FormData: {FormData}", formData);

        var formDataObj = JsonDocument.Parse(formData).RootElement;
        var extraVars = new Dictionary<string, object>();

        // Copia todos os campos do FormData para extra_vars
        foreach (var prop in formDataObj.EnumerateObject())
        {
            extraVars[prop.Name] = prop.Value.GetRawText();
        }

        var payload = new AwxLaunchRequest
        {
            ExtraVars = extraVars
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = false });
        _logger.LogInformation("✅ AwxPayload preparado: {Payload}", json);
        return json;
    }

    private string PrepareOoPayload(string formData, string flowUuid)
    {
        _logger.LogInformation("🔧 PrepareOoPayload com FormData: {FormData}", formData);

        var formDataObj = JsonDocument.Parse(formData).RootElement;
        var inputs = new Dictionary<string, object>();

        // Copia todos os campos do FormData para inputs
        foreach (var prop in formDataObj.EnumerateObject())
        {
            inputs[prop.Name] = prop.Value.GetRawText();
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