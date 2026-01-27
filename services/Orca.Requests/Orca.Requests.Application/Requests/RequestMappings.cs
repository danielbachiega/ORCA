using Orca.Requests.Domain.Entities;

namespace Orca.Requests.Application.Requests;

public static class RequestMappings
{
    // DTO de entrada → Entidade (para Create)
    public static Request ToEntity(this CreateRequestDto dto)
    {
        return new Request
        {
            OfferId = dto.OfferId,
            FormDefinitionId = dto.FormDefinitionId,
            UserId = dto.UserId,
            FormData = dto.FormData,
            Status = RequestStatus.Pending,  // Sempre começa como Pending
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    // DTO de entrada → Entidade (para Update)
    public static Request ToEntity(this UpdateRequestDto dto)
    {
        return new Request
        {
            Id = dto.Id,
            OfferId = dto.OfferId,
            FormDefinitionId = dto.FormDefinitionId,
            UserId = dto.UserId,
            FormData = dto.FormData,
            Status = (RequestStatus)dto.Status,  // Converte int → enum
            ResultType = dto.ResultType.HasValue ? (ExecutionResultType)dto.ResultType : null,
            AwxOoExecutionStatus = dto.AwxOoExecutionStatus,
            ExecutionId = dto.ExecutionId,
            ErrorMessage = dto.ErrorMessage
        };
    }

    // Entidade → Summary DTO
    public static RequestSummaryDto ToSummaryDto(this Request entity)
    {
        return new RequestSummaryDto
        {
            Id = entity.Id,
            OfferId = entity.OfferId,
            FormDefinitionId = entity.FormDefinitionId,
            UserId = entity.UserId,
            Status = (int)entity.Status,  // Converte enum → int
            ResultType = (int?)entity.ResultType,
            CreatedAtUtc = entity.CreatedAtUtc,
            StartedAtUtc = entity.StartedAtUtc,
            CompletedAtUtc = entity.CompletedAtUtc
        };
    }

    // Entidade → Details DTO
    public static RequestDetailsDto ToDetailsDto(this Request entity)
    {
        return new RequestDetailsDto
        {
            Id = entity.Id,
            OfferId = entity.OfferId,
            FormDefinitionId = entity.FormDefinitionId,
            UserId = entity.UserId,
            FormData = entity.FormData,
            Status = (int)entity.Status,
            ResultType = (int?)entity.ResultType,
            AwxOoExecutionStatus = entity.AwxOoExecutionStatus,
            ExecutionId = entity.ExecutionId,
            CreatedAtUtc = entity.CreatedAtUtc,
            StartedAtUtc = entity.StartedAtUtc,
            CompletedAtUtc = entity.CompletedAtUtc,
            ErrorMessage = entity.ErrorMessage
        };
    }
}