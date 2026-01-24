using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Application.ExecutionTemplates;

public static class ExecutionTemplateMappings
{
    // Entity → DTO Summary
    public static ExecutionTemplateSummaryDto ToSummaryDto(this ExecutionTemplate entity)
    {
        return new ExecutionTemplateSummaryDto
        {
            Id = entity.Id,
            FormDefinitionId = entity.FormDefinitionId,
            TargetType = entity.TargetType,
            ResourceType = entity.ResourceType,
            ResourceId = entity.ResourceId,
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc
        };
    }

    // Entity → DTO Details
    public static ExecutionTemplateDetailsDto ToDetailsDto(this ExecutionTemplate entity)
    {
        return new ExecutionTemplateDetailsDto
        {
            Id = entity.Id,
            FormDefinitionId = entity.FormDefinitionId,
            TargetType = entity.TargetType,
            ResourceType = entity.ResourceType,
            ResourceId = entity.ResourceId,
            FieldMappings = entity.FieldMappings.Select(fm => fm.ToDto()).ToList(),
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc
        };
    }

    // CreateDto → Entity
    public static ExecutionTemplate ToEntity(this CreateExecutionTemplateDto dto)
    {
        return new ExecutionTemplate
        {
            FormDefinitionId = dto.FormDefinitionId,
            TargetType = dto.TargetType,
            ResourceType = dto.ResourceType,
            ResourceId = dto.ResourceId,
            FieldMappings = dto.FieldMappings.Select(fm => fm.ToEntity()).ToList(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    // UpdateDto → Entity
    public static ExecutionTemplate ToEntity(this UpdateExecutionTemplateDto dto)
    {
        return new ExecutionTemplate
        {
            Id = dto.Id,
            FormDefinitionId = dto.FormDefinitionId,
            TargetType = dto.TargetType,
            ResourceType = dto.ResourceType,
            ResourceId = dto.ResourceId,
            FieldMappings = dto.FieldMappings.Select(fm => fm.ToEntity()).ToList(),
            UpdatedAtUtc = DateTime.UtcNow
        };
    }

    // FieldMapping Entity → DTO
    public static FieldMappingDto ToDto(this FieldMapping entity)
    {
        return new FieldMappingDto
        {
            PayloadFieldName = entity.PayloadFieldName,
            SourceType = entity.SourceType,
            SourceValue = entity.SourceValue
        };
    }

    // FieldMappingDto → Entity
    public static FieldMapping ToEntity(this FieldMappingDto dto)
    {
        return new FieldMapping
        {
            PayloadFieldName = dto.PayloadFieldName,
            SourceType = dto.SourceType,
            SourceValue = dto.SourceValue
        };
    }
}