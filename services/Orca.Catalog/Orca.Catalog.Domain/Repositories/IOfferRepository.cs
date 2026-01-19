using Orca.Catalog.Domain.Entities;

namespace Orca.Catalog.Domain.Repositories;

public interface IOfferRepository
{
    Task<Offer> GetByIdAsync(Guid id);
    Task<Offer> GetBySlugAsync(string slug);
    Task<IEnumerable<Offer>> GetAllAsync();
    Task<Offer> CreateAsync(Offer offer);
    Task<Offer> UpdateAsync(Offer offer);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<bool> SlugExistsAsync(string slug, Guid excludeId = default);
}
