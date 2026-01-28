using System.Text;
using System.Text.Json;
using Polly;
using Polly.CircuitBreaker;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Orca.Orchestrator.Application.Clients.Dtos;
using Orca.Orchestrator.Application.Clients;

namespace Orca.Orchestrator.Infrastructure.Clients;

public class AwxClient : IExecutionClient
{
    private readonly HttpClient _httpClient;
    private readonly string _awxBaseUrl;
    private readonly string _awxUsername;
    private readonly string _awxPassword;
    private readonly IAsyncPolicy<HttpResponseMessage> _retryPolicy;
    private readonly ILogger<AwxClient> _logger;

    public AwxClient(
        HttpClient httpClient,
        IConfiguration config,
        ILogger<AwxClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Ler configurações do appsettings
        _awxBaseUrl = config["Awx:BaseUrl"] ?? "http://localhost:80";
        _awxUsername = config["Awx:Username"] ?? "admin";
        _awxPassword = config["Awx:Password"] ?? "password";

        // ⏱️ RETRY POLICY - Polly
        _retryPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => 
                (int)r.StatusCode >= 500 ||  // 500, 502, 503, etc
                r.StatusCode == System.Net.HttpStatusCode.RequestTimeout)
            .Or<HttpRequestException>()  // Falhas de conexão
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => 
                    TimeSpan.FromSeconds(Math.Pow(2, attempt)),  // 2s, 4s, 8s (backoff exponencial)
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    _logger.LogWarning(
                        "🔄 AwxClient Retry {RetryCount} após {Delay}ms. Status: {StatusCode}",
                        retryCount, timespan.TotalMilliseconds,
                        outcome.Result?.StatusCode ?? System.Net.HttpStatusCode.OK);
                });
    }

    public async Task<string> LaunchAsync(string executionPayload)
    {
        _logger.LogInformation("📤 AwxClient.LaunchAsync com payload: {Payload}", executionPayload);

        try
        {
            // Parse do payload para extrair info
            var payloadJson = JsonDocument.Parse(executionPayload);
            var root = payloadJson.RootElement;

            // Determina qual endpoint usar baseado em ExecutionResourceType
            // (você vai passar isso no payload ou usar factory diferente)
            // Por enquanto, assumimos que vem no payload
            var endpoint = $"{_awxBaseUrl}/api/v2/job_templates/1/launch/";

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            
            // ✅ Basic Auth
            var authHeader = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{_awxUsername}:{_awxPassword}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", authHeader);

            request.Content = new StringContent(executionPayload, Encoding.UTF8, "application/json");

            // 🔄 Executa com retry policy
            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.SendAsync(request));

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "❌ AwxClient.LaunchAsync falhou: {StatusCode} {Error}",
                    response.StatusCode, errorContent);
                throw new HttpRequestException($"AWX Launch Failed: {response.StatusCode}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var launchResponse = JsonSerializer.Deserialize<AwxLaunchResponse>(content);

            if (launchResponse?.Id == 0)
            {
                throw new InvalidOperationException("AWX não retornou um ID válido");
            }

            _logger.LogInformation("✅ AwxClient.LaunchAsync sucesso. JobId: {JobId}", launchResponse!.Id);
            return launchResponse.Id.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ AwxClient.LaunchAsync erro não tratado");
            throw;
        }
    }

    public async Task<string> GetStatusAsync(string executionId)
    {
        _logger.LogInformation("📊 AwxClient.GetStatusAsync para JobId: {JobId}", executionId);

        try
        {
            var endpoint = $"{_awxBaseUrl}/api/v2/jobs/{executionId}/";

            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            
            var authHeader = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{_awxUsername}:{_awxPassword}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", authHeader);

            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.SendAsync(request));

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("⚠️ AwxClient.GetStatusAsync retornou: {StatusCode}", response.StatusCode);
                return "unknown";  // Retorna "unknown" em vez de lançar exceção
            }

            var content = await response.Content.ReadAsStringAsync();
            var statusResponse = JsonSerializer.Deserialize<AwxJobStatusResponse>(content);

            var status = statusResponse?.Status ?? "unknown";
            _logger.LogInformation("📊 AwxClient.GetStatusAsync Status: {Status}", status);
            return status;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ AwxClient.GetStatusAsync erro");
            return "unknown";  // Falha graceful
        }
    }

    public async Task<string?> GetResultStatusTypeAsync(string executionId)
    {
        // AWX não tem conceito de ResultStatusType (isso é apenas OO) NECESSARIO PARA NAO QUEBRAR O IExecutionClient
        return null;
    }
}