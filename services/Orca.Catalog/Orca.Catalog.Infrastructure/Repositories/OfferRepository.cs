using Microsoft.EntityFrameworkCore;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;

namespace Orca.Catalog.Infrastructure.Repositories;

/// <summary>
/// Implementação do repositório de Offer usando Entity Framework Core
/// </summary>
public class OfferRepository : IOfferRepository
{
    private readonly CatalogContext _context;

    public OfferRepository(CatalogContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Offer> GetByIdAsync(Guid id)
    {
        return await _context.Offers
            .Include(o => o.VisibleToRoles)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<Offer> GetBySlugAsync(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            throw new ArgumentException("Slug não pode estar vazio", nameof(slug));

        return await _context.Offers
            .Include(o => o.VisibleToRoles)
            .FirstOrDefaultAsync(o => o.Slug == slug);
    }

    public async Task<IEnumerable<Offer>> GetAllAsync()
    {
        return await _context.Offers
            .Include(o => o.VisibleToRoles)
            .ToListAsync();
    }

    public async Task<Offer> CreateAsync(Offer offer)
    {
        if (offer == null)
            throw new ArgumentNullException(nameof(offer));

        var slugExists = await SlugExistsAsync(offer.Slug);
        if (slugExists)
            throw new InvalidOperationException($"Já existe uma Offer com o Slug '{offer.Slug}'");

        _context.Offers.Add(offer);
        await _context.SaveChangesAsync();

        return offer;
    }

    public async Task<Offer> UpdateAsync(Offer offer)
    {
        if (offer == null)
            throw new ArgumentNullException(nameof(offer));

        var existingOffer = await GetByIdAsync(offer.Id);
        if (existingOffer == null)
            throw new InvalidOperationException($"Offer com ID '{offer.Id}' não foi encontrada");

        if (existingOffer.Slug != offer.Slug && await SlugExistsAsync(offer.Slug, offer.Id))
            throw new InvalidOperationException($"Já existe uma Offer com o Slug '{offer.Slug}'");

        _context.Entry(existingOffer).CurrentValues.SetValues(offer);
        await _context.SaveChangesAsync();

        return existingOffer;
    }

    public async Task DeleteAsync(Guid id)
    {
        var offer = await GetByIdAsync(id);
        if (offer == null)
            throw new InvalidOperationException($"Offer com ID '{id}' não foi encontrada");

        _context.Offers.Remove(offer);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Offers.AnyAsync(o => o.Id == id);
    }

    public async Task<bool> SlugExistsAsync(string slug, Guid excludeId = default)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        var query = _context.Offers.Where(o => o.Slug == slug);

        if (excludeId != default)
            query = query.Where(o => o.Id != excludeId);

        return await query.AnyAsync();
    }
}
