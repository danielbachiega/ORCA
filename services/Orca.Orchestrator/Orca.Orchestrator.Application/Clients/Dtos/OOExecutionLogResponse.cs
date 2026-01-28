using System.Text.Json.Serialization;

namespace Orca.Orchestrator.Application.Clients.Dtos;

public class OoExecutionLogResponse
{
    [JsonPropertyName("executionSummary")]
    public ExecutionSummary ExecutionSummary { get; set; } = new();

    [JsonPropertyName("flowVars")]
    public List<FlowVar> FlowVars { get; set; } = new();

    [JsonPropertyName("flowOutput")]
    public Dictionary<string, object> FlowOutput { get; set; } = new();
}

public class ExecutionSummary
{
    [JsonPropertyName("executionId")]
    public string ExecutionId { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("resultStatusType")]
    public string? ResultStatusType { get; set; }
}

public class FlowVar
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;
}