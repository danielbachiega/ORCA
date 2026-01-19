namespace Orca.Catalog.Application.DTOs;

public class CreateFormDefinitionDto
{
    public Guid OfferId { get; set; }
    public int Version { get; set; }
    public string JsonSchema { get; set; } = string.Empty;
    public string? UiSchema { get; set; }
    public string? Rules { get; set; }
}

public class UpdateFormDefinitionDto
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public int Version { get; set; }
    public string JsonSchema { get; set; } = string.Empty;
    public string? UiSchema { get; set; }
    public string? Rules { get; set; }
}
