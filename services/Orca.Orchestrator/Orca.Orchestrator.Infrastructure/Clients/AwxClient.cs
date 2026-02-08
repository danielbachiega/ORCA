using System.Text;
using System.Text.Json;
using Polly;
using Polly.CircuitBreaker;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Orca.Orchestrator.Application.Clients.Dtos;
using Orca.Orchestrator.Application.Clients;

namespace Orca.Orchestrator.Infrastructure.Clients;

public class AwxClient : IAwxExecutionClient
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
        _awxBaseUrl = config["ExternalServices:AwxBaseUrl"] ?? "http://localhost:80";
        _awxUsername = config["ExternalServices:AwxUsername"] ?? "admin";
        _awxPassword = config["ExternalServices:AwxPassword"] ?? "password";

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

            string? resourceId = null;
            int? resourceType = null;
            JsonElement launchPayloadElement = root;

            if (root.TryGetProperty("resourceId", out var resourceIdProp) &&
                resourceIdProp.ValueKind == JsonValueKind.String)
            {
                resourceId = resourceIdProp.GetString();
            }

            if (root.TryGetProperty("resourceType", out var resourceTypeProp) &&
                resourceTypeProp.ValueKind == JsonValueKind.Number)
            {
                resourceType = resourceTypeProp.GetInt32();
            }

            if (root.TryGetProperty("launch", out var launchProp))
            {
                launchPayloadElement = launchProp;
            }

            if (string.IsNullOrWhiteSpace(resourceId))
            {
                throw new InvalidOperationException("AWX resourceId não informado no payload");
            }

            // Determina endpoint baseado em resourceType (0=JobTemplate, 1=Workflow)
            var endpoint = resourceType == 1
                ? $"{_awxBaseUrl}/api/v2/workflow_job_templates/{resourceId}/launch/"
                : $"{_awxBaseUrl}/api/v2/job_templates/{resourceId}/launch/";

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            
            // ✅ Basic Auth
            var authHeader = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{_awxUsername}:{_awxPassword}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", authHeader);

            var launchPayloadJson = launchPayloadElement.GetRawText();
            request.Content = new StringContent(launchPayloadJson, Encoding.UTF8, "application/json");

            LogRequest(endpoint, request, launchPayloadJson);

            // 🔄 Executa com retry policy
            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.SendAsync(request));

            var responseBody = await response.Content.ReadAsStringAsync();
            LogResponse(endpoint, response, responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "❌ AwxClient.LaunchAsync falhou: {StatusCode} {Error}",
                    response.StatusCode, responseBody);
                throw new HttpRequestException($"AWX Launch Failed: {response.StatusCode}");
            }

            var launchResponse = JsonSerializer.Deserialize<AwxLaunchResponse>(responseBody);

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

            var responseBody = await response.Content.ReadAsStringAsync();
            LogResponse(endpoint, response, responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("⚠️ AwxClient.GetStatusAsync retornou: {StatusCode}", response.StatusCode);
                return "unknown";  // Retorna "unknown" em vez de lançar exceção
            }

            var statusResponse = JsonSerializer.Deserialize<AwxJobStatusResponse>(responseBody);

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

    public Task<string?> GetResultStatusTypeAsync(string executionId)
    {
        // AWX não tem conceito de ResultStatusType (isso é apenas OO) NECESSARIO PARA NAO QUEBRAR O IExecutionClient
        return Task.FromResult<string?>(null);
    }

    private void LogRequest(string endpoint, HttpRequestMessage request, string body)
    {
        var headers = request.Headers
            .Select(h => new
            {
                Name = h.Key,
                Value = h.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase)
                    ? "***"
                    : string.Join(",", h.Value)
            })
            .ToDictionary(h => h.Name, h => h.Value);

        var contentHeaders = request.Content?.Headers
            .ToDictionary(h => h.Key, h => string.Join(",", h.Value))
            ?? new Dictionary<string, string>();

        _logger.LogInformation(
            "🌐 AwxClient Request -> Endpoint: {Endpoint} | Headers: {@Headers} | ContentHeaders: {@ContentHeaders} | Body: {Body}",
            endpoint, headers, contentHeaders, body);
    }

    private void LogResponse(string endpoint, HttpResponseMessage response, string body)
    {
        var headers = response.Headers
            .ToDictionary(h => h.Key, h => string.Join(",", h.Value));

        var contentHeaders = response.Content?.Headers
            .ToDictionary(h => h.Key, h => string.Join(",", h.Value))
            ?? new Dictionary<string, string>();

        _logger.LogInformation(
            "🌐 AwxClient Response -> Endpoint: {Endpoint} | Status: {StatusCode} | Headers: {@Headers} | ContentHeaders: {@ContentHeaders} | Body: {Body}",
            endpoint, response.StatusCode, headers, contentHeaders, body);
    }
}