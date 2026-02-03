namespace Orca.Forms.Domain.Entities;

public class ExecutionTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FormDefinitionId { get; set; }          // 1:1 com FormDefinition
    public ExecutionTargetType TargetType { get; set; } // AWX ou OO
    public ExecutionResourceType? ResourceType { get; set; } // AWX: JobTemplate/Workflow; OO: null
    public string ResourceId { get; set; } = string.Empty;   // AWX id template/workflow; OO flowUuid
    public List<FieldMapping> FieldMappings { get; set; } = new();
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}

public enum ExecutionTargetType
{
    AWX,
    OO
}

public enum ExecutionResourceType
{
    JobTemplate,
    Workflow
}

public class FieldMapping
{
    public string PayloadFieldName { get; set; } = string.Empty; // ex: "input1"
    public FieldMappingSourceType SourceType { get; set; }       // FormField ou FixedValue
    public string SourceValue { get; set; } = string.Empty;      // "email" (campo form) ou "admin" (valor fixo)
}

public enum FieldMappingSourceType
{
    FormField,
    FixedValue
}