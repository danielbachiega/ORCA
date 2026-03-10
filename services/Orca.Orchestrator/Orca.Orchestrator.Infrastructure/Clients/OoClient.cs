using System.Text;
using System.Text.Json;
using Polly;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Orca.Orchestrator.Application.Clients.Dtos;
using Orca.Orchestrator.Application.Clients;

namespace Orca.Orchestrator.Infrastructure.Clients;

public class OoClient : IOoExecutionClient
{
    private readonly HttpClient _httpClient;
    private readonly string _ooBaseUrl;
    private readonly string _ooUsername;
    private readonly string _ooPassword;
    private readonly IAsyncPolicy<HttpResponseMessage> _retryPolicy;
    private readonly ILogger<OoClient> _logger;

    public OoClient(
        HttpClient httpClient,
        IConfiguration config,
        ILogger<OoClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Ler configurações do appsettings
        _ooBaseUrl = config["ExternalServices:OoBaseUrl"] ?? "http://localhost:8080";
        _ooUsername = config["ExternalServices:OoUsername"] ?? "admin";
        _ooPassword = config["ExternalServices:OoPassword"] ?? "password";

        // ⏱️ RETRY POLICY - Polly (idêntica ao AWX)
        _retryPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => 
                (int)r.StatusCode >= 500 ||
                r.StatusCode == System.Net.HttpStatusCode.RequestTimeout)
            .Or<HttpRequestException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => 
                    TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    _logger.LogWarning(
                        "🔄 OoClient Retry {RetryCount} após {Delay}ms. Status: {StatusCode}",
                        retryCount, timespan.TotalMilliseconds,
                        outcome.Result?.StatusCode ?? System.Net.HttpStatusCode.OK);
                });
    }

    public async Task<string> LaunchAsync(string executionPayload)
    {
        _logger.LogInformation("📤 OoClient.LaunchAsync com payload: {Payload}", executionPayload);

        try
        {
            // Parse do payload para extrair flowUuid
            var payloadJson = JsonDocument.Parse(executionPayload);
            var root = payloadJson.RootElement;

            // OO retorna executionId como string numérica (ex: "12345678901")
            var endpoint = $"{_ooBaseUrl}/oo/rest/v2/executions";

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            
            // ✅ Basic Auth (OO também usa Basic Auth)
            var authHeader = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{_ooUsername}:{_ooPassword}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", authHeader);

            request.Content = new StringContent(executionPayload, Encoding.UTF8, "application/json");

            LogRequest(endpoint, request, executionPayload);

            // 🔄 Executa com retry policy
            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.SendAsync(request));

            var responseBody = await response.Content.ReadAsStringAsync();
            LogResponse(endpoint, response, responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "❌ OoClient.LaunchAsync falhou: {StatusCode} {Error}",
                    response.StatusCode, responseBody);
                throw new HttpRequestException($"OO Launch Failed: {response.StatusCode}");
            }

            // OO retorna o executionId direto como string numérica (ex: 12345678901)
            // Sem aspas, apenas o número no body
            var executionId = responseBody.Trim();  // Remove apenas whitespace

            if (string.IsNullOrEmpty(executionId) || !long.TryParse(executionId, out _))
            {
                throw new InvalidOperationException($"OO não retornou um ID válido: {executionId}");
            }

            _logger.LogInformation("✅ OoClient.LaunchAsync sucesso. ExecutionId: {ExecutionId}", executionId);
            return executionId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ OoClient.LaunchAsync erro não tratado");
            throw;
        }
    }

    public async Task<string> GetStatusAsync(string executionId)
    {
        _logger.LogInformation("📊 OoClient.GetStatusAsync para ExecutionId: {ExecutionId}", executionId);

        try
        {
            var endpoint = $"{_ooBaseUrl}/oo/rest/v2/executions/{executionId}/execution-log";

            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            
            var authHeader = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{_ooUsername}:{_ooPassword}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", authHeader);

            LogRequest(endpoint, request, string.Empty);

            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.SendAsync(request));

            var responseBody = await response.Content.ReadAsStringAsync();
            LogResponse(endpoint, response, responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("⚠️ OoClient.GetStatusAsync retornou: {StatusCode}", response.StatusCode);
                return "unknown";
            }

            var executionLog = JsonSerializer.Deserialize<OoExecutionLogResponse>(responseBody);

            var status = executionLog?.ExecutionSummary.Status ?? "unknown";
            _logger.LogInformation("📊 OoClient.GetStatusAsync Status: {Status}", status);
            return status;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ OoClient.GetStatusAsync erro");
            return "unknown";
        }
    }

    public async Task<string?> GetResultStatusTypeAsync(string executionId)
    {
        _logger.LogInformation("📊 OoClient.GetResultStatusTypeAsync para ExecutionId: {ExecutionId}", executionId);

        try
        {
            var endpoint = $"{_ooBaseUrl}/oo/rest/v2/executions/{executionId}/execution-log";

            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            
            var authHeader = Convert.ToBase64String(
                Encoding.ASCII.GetBytes($"{_ooUsername}:{_ooPassword}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Basic", authHeader);

            LogRequest(endpoint, request, string.Empty);

            var response = await _retryPolicy.ExecuteAsync(async () =>
                await _httpClient.SendAsync(request));

            var responseBody = await response.Content.ReadAsStringAsync();
            LogResponse(endpoint, response, responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("⚠️ OoClient.GetResultStatusTypeAsync retornou: {StatusCode}", response.StatusCode);
                return null;
            }

            var executionLog = JsonSerializer.Deserialize<OoExecutionLogResponse>(responseBody);

            var resultType = executionLog?.ExecutionSummary.ResultStatusType;
            _logger.LogInformation("📊 OoClient.GetResultStatusTypeAsync ResultType: {ResultType}", resultType);
            return resultType;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ OoClient.GetResultStatusTypeAsync erro");
            return null;
        }
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
            "🌐 OoClient Request -> Endpoint: {Endpoint} | Headers: {@Headers} | ContentHeaders: {@ContentHeaders} | Body: {Body}",
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
            "🌐 OoClient Response -> Endpoint: {Endpoint} | Status: {StatusCode} | Headers: {@Headers} | ContentHeaders: {@ContentHeaders} | Body: {Body}",
            endpoint, response.StatusCode, headers, contentHeaders, body);
    }
}