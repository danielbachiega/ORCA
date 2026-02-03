using System.Text.Json.Serialization;

namespace Orca.Orchestrator.Application.Clients.Dtos;

public class OoExecutionRequest
{
    [JsonPropertyName("flowUuid")]
    public string FlowUuid { get; set; } = string.Empty;

    [JsonPropertyName("inputs")]
    public Dictionary<string, object> Inputs { get; set; } = new();
}