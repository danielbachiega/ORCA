namespace Orca.Requests.Application.Requests;

public interface IRequestService
{
    // Consultas (retornam DTOs, não entidades)
    Task<IEnumerable<RequestSummaryDto>> GetAllAsync();
    Task<RequestDetailsDto?> GetByIdAsync(Guid id);
    Task<IEnumerable<RequestSummaryDto>> GetByOfferIdAsync(Guid offerId);
    Task<IEnumerable<RequestSummaryDto>> GetByUserIdAsync(string userId);
    Task<IEnumerable<RequestSummaryDto>> GetByUserAndOfferAsync(string userId, Guid offerId);
    
    // Comandos (recebem DTOs de entrada, retornam DTOs de saída)
    Task<RequestDetailsDto> CreateAsync(CreateRequestDto dto);
    Task<RequestDetailsDto> UpdateAsync(UpdateRequestDto dto);
    Task UpdateStatusAsync(Guid requestId, int status, string? errorMessage = null, DateTime? completedAtUtc = null);
    Task DeleteAsync(Guid id);
}