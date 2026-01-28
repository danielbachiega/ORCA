using System.Text.Json.Serialization;

namespace Orca.Orchestrator.Application.Clients.Dtos;

public class AwxJobStatusResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("failed")]
    public bool Failed { get; set; }

    [JsonPropertyName("started")]
    public string? Started { get; set; }

    [JsonPropertyName("finished")]
    public string? Finished { get; set; }
}