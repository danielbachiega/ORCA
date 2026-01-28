using Orca.Orchestrator.Domain.Entities;

namespace Orca.Orchestrator.Application.JobExecutions;

/// <summary>
/// Serviço de orquestração: cria execuções, dispara para AWX/OO, monitora via polling
/// </summary>
public interface IJobExecutionService
{
    /// <summary>
    /// Cria um novo JobExecution quando recebe RequestCreatedEvent
    /// Ainda em status "pending" (não foi disparado ainda)
    /// </summary>
    Task<JobExecution> CreateJobExecutionAsync(
        Guid requestId,
        int executionTargetType,
        int? executionResourceType,
        string executionResourceId,
        string formData);

    /// <summary>
    /// Dispara a execução para AWX/OO
    /// Atualiza a execução com AwxOoJobId e muda status para "running"
    /// </summary>
    /// <returns>Tuple (AwxOoJobId, ExecutionPayload, ExecutionResponse)</returns>
    Task<(string executionId, string payload, string response)> SendToAwxOoAsync(
        JobExecution jobExecution,
        string formData);

    /// <summary>
    /// POLLING WORKER - chamado a cada 5 segundos
    /// Verifica status de execuções pendentes e publica eventos quando termina
    /// </summary>
    Task ProcessPendingExecutionsAsync();

    /// <summary>
    /// Busca uma execução específica por ID
    /// </summary>
    Task<JobExecution?> GetJobExecutionAsync(Guid jobExecutionId);

    /// <summary>
    /// Busca a execução de uma request específica
    /// </summary>
    Task<JobExecution?> GetJobExecutionByRequestIdAsync(Guid requestId);
}