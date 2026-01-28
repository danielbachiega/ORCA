using System.Text.Json.Serialization;

namespace Orca.Orchestrator.Application.Clients.Dtos;

public class AwxLaunchRequest
{
    [JsonPropertyName("ask_limit_on_launch")]
    public string AskLimitOnLaunch { get; set; } = "false";

    [JsonPropertyName("ask_scm_branch_on_launch")]
    public string AskScmBranchOnLaunch { get; set; } = "false";

    [JsonPropertyName("extra_vars")]
    public Dictionary<string, object> ExtraVars { get; set; } = new();
}