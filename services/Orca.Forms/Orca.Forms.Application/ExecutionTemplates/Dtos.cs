using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Application.ExecutionTemplates;

// DTOs de entrada
public class CreateExecutionTemplateDto
{
    public Guid FormDefinitionId { get; set; }
    public ExecutionTargetType TargetType { get; set; }
    public ExecutionResourceType? ResourceType { get; set; }
    public string ResourceId { get; set; } = string.Empty;
    public List<FieldMappingDto> FieldMappings { get; set; } = new();
}

public class UpdateExecutionTemplateDto
{
    public Guid Id { get; set; }
    public Guid FormDefinitionId { get; set; }
    public ExecutionTargetType TargetType { get; set; }
    public ExecutionResourceType? ResourceType { get; set; }
    public string ResourceId { get; set; } = string.Empty;
    public List<FieldMappingDto> FieldMappings { get; set; } = new();
}

// DTOs de saída
public class ExecutionTemplateSummaryDto
{
    public Guid Id { get; set; }
    public Guid FormDefinitionId { get; set; }
    public ExecutionTargetType TargetType { get; set; }
    public ExecutionResourceType? ResourceType { get; set; }
    public string ResourceId { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class ExecutionTemplateDetailsDto
{
    public Guid Id { get; set; }
    public Guid FormDefinitionId { get; set; }
    public ExecutionTargetType TargetType { get; set; }
    public ExecutionResourceType? ResourceType { get; set; }
    public string ResourceId { get; set; } = string.Empty;
    public List<FieldMappingDto> FieldMappings { get; set; } = new();
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

// DTO para FieldMapping
public class FieldMappingDto
{
    public string PayloadFieldName { get; set; } = string.Empty;
    public FieldMappingSourceType SourceType { get; set; }
    public string SourceValue { get; set; } = string.Empty;
}