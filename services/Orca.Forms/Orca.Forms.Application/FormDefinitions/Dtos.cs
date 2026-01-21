namespace Orca.Forms.Application.FormDefinitions;

public class CreateFormDefinitionDto
{
    public Guid OfferId { get; set; }
    public int Version { get; set; }
    public string SchemaJson { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = false;
}

public class UpdateFormDefinitionDto
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public int Version { get; set; }
    public string SchemaJson { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = false;
}

// DTOs de saída
public class FormDefinitionSummaryDto
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public int Version { get; set; }
    public bool IsPublished { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class FormDefinitionDetailsDto
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public int Version { get; set; }
    public string SchemaJson { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}