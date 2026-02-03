using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Application.FormDefinitions;

public static class FormDefinitionMappings
{
    // DTO de entrada → Entidade (para Create)
    public static FormDefinition ToEntity(this CreateFormDefinitionDto dto)
    {
        return new FormDefinition
        {
            OfferId = dto.OfferId,
            Version = dto.Version,
            SchemaJson = dto.SchemaJson,
            IsPublished = dto.IsPublished,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    // DTO de entrada → Entidade (para Update)
    public static FormDefinition ToEntity(this UpdateFormDefinitionDto dto)
    {
        return new FormDefinition
        {
            Id = dto.Id,
            OfferId = dto.OfferId,
            Version = dto.Version,
            SchemaJson = dto.SchemaJson,
            IsPublished = dto.IsPublished,
            UpdatedAtUtc = DateTime.UtcNow  // Seta automaticamente
        };
    }

    // Entidade → Summary DTO
    public static FormDefinitionSummaryDto ToSummaryDto(this FormDefinition entity)
    {
        return new FormDefinitionSummaryDto
        {
            Id = entity.Id,
            OfferId = entity.OfferId,
            Version = entity.Version,
            IsPublished = entity.IsPublished,
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc
        };
    }

    // Entidade → Details DTO
    public static FormDefinitionDetailsDto ToDetailsDto(this FormDefinition entity)
    {
        return new FormDefinitionDetailsDto
        {
            Id = entity.Id,
            OfferId = entity.OfferId,
            Version = entity.Version,
            SchemaJson = entity.SchemaJson,
            IsPublished = entity.IsPublished,
            CreatedAtUtc = entity.CreatedAtUtc,
            UpdatedAtUtc = entity.UpdatedAtUtc
        };
    }
}