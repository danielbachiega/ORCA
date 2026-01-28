using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Orca.Orchestrator.Application.JobExecutions;
using Microsoft.Extensions.Logging;

namespace Orca.Orchestrator.Application.Workers;

public class PollingWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PollingWorker> _logger;
    private const int POLLING_INTERVAL_MS = 5000;  // 5 segundos

    public PollingWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<PollingWorker> logger)
    {
        _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 PollingWorker iniciado");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 🔄 Cria um escopo para resolver serviços Scoped
                using var scope = _scopeFactory.CreateScope();
                var jobExecutionService = scope.ServiceProvider.GetRequiredService<IJobExecutionService>();

                // 🔄 Executa polling de execuções pendentes
                await jobExecutionService.ProcessPendingExecutionsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro em PollingWorker");
                // Continua executando mesmo se houver erro
            }

            // ⏱️ Aguarda 5 segundos antes do próximo ciclo
            await Task.Delay(POLLING_INTERVAL_MS, stoppingToken);
        }

        _logger.LogInformation("⏹️ PollingWorker parado");
    }
}