using Orca.Catalog.Domain.Entities;

namespace Orca.Catalog.Infrastructure.Repositories;
public interface IOfferRepository
{
    // Metodos de leitura
    Task<Offer> GetByIdAsync(Guid id);
    Task<Offer> GetBySlugAsync(string slug);
    Task<IEnumerable<Offer>> GetAllAsync();
    // Metodos de escrita
    Task<Offer> CreateAsync(Offer offer);
    Task<Offer> UpdateAsync(Offer offer);
    Task DeleteAsync(Guid id);
    //Metodos de verificação
    Task<bool> ExistsAsync(Guid id);
    Task<bool> SlugExistsAsync(string slug, Guid excludeId = default);
}