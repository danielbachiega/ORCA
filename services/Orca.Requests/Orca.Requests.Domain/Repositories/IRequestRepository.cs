using Orca.Requests.Domain.Entities;

namespace Orca.Requests.Domain.Repositories;

public interface IRequestRepository
{
    // Consultas
    Task<IEnumerable<Request>> GetAllAsync();
    Task<Request?> GetByIdAsync(Guid id);
    Task<IEnumerable<Request>> GetByOfferIdAsync(Guid offerId);
    Task<IEnumerable<Request>> GetByUserIdAsync(string userId);
    Task<IEnumerable<Request>> GetByStatusAsync(RequestStatus status);
    Task<IEnumerable<Request>> GetByUserAndOfferAsync(string userId, Guid offerId);
    
    // Comandos
    Task<Request> CreateAsync(Request request);
    Task<Request> UpdateAsync(Request request);
    Task DeleteAsync(Guid id);
}