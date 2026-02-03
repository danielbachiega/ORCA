namespace Orca.Orchestrator.Application.Clients;

/// <summary>
/// Interface genérica para disparar e consultar execuções em AWX/OO
/// Implementações: AwxClient (para AWX Job Templates e Workflows) e OoClient (para OO Flows)
/// </summary>
public interface IExecutionClient
{
    /// <summary>
    /// Dispara uma execução no AWX/OO
    /// </summary>
    /// <param name="executionPayload">JSON serializado com inputs/extra_vars</param>
    /// <returns>ID da execução como string (convertido de int para AWX, direto do OO)</returns>
    Task<string> LaunchAsync(string executionPayload);

    /// <summary>
    /// Consulta o status de uma execução no AWX/OO
    /// </summary>
    /// <param name="executionId">ID retornado pelo Launch</param>
    /// <returns>Status atual (RUNNING, COMPLETED, FAILED, etc)</returns>
    Task<string> GetStatusAsync(string executionId);

    /// <summary>
    /// Consulta o resultado de uma execução (apenas para OO quando COMPLETED)
    /// </summary>
    /// <param name="executionId">ID da execução</param>
    /// <returns>ResultStatusType (RESOLVED, ERROR, DIAGNOSED, NO_ACTION_TAKEN)</returns>
    Task<string?> GetResultStatusTypeAsync(string executionId);
}