using System.Text.Json.Serialization;

namespace Orca.Orchestrator.Application.Clients.Dtos;

public class AwxLaunchResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("extra_vars")]
    public string ExtraVars { get; set; } = string.Empty;
}