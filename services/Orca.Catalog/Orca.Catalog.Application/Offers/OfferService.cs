using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;

namespace Orca.Catalog.Application.Offers;

public interface IOfferService
{
    Task<IEnumerable<OfferSummaryDto>> GetAllAsync();
    Task<OfferDetailsDto?> GetByIdAsync(Guid id);
    Task<OfferDetailsDto?> GetBySlugAsync(string slug);
    Task<OfferDetailsDto> CreateAsync(CreateOfferDto dto);
    Task<OfferDetailsDto> UpdateAsync(UpdateOfferDto dto);
    Task<IEnumerable<OfferSummaryDto>> GetByRolesAsync(string[] roles);
    Task DeleteAsync(Guid id);
}

public class OfferService : IOfferService
{
    
    private readonly IOfferRepository _repository;

    public OfferService(IOfferRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    public async Task<IEnumerable<OfferSummaryDto>> GetAllAsync()
    {
        var offers = await _repository.GetAllAsync();
        return offers.Select(o => o.ToSummary());
    }

    public async Task<OfferDetailsDto?> GetByIdAsync(Guid id)
    {
        var offer = await _repository.GetByIdAsync(id);
        return offer?.ToDetails();
    }

    public async Task<OfferDetailsDto?> GetBySlugAsync(string slug)
    {
        var offer = await _repository.GetBySlugAsync(slug);
        return offer?.ToDetails();
    }

    public async Task<OfferDetailsDto> CreateAsync(CreateOfferDto dto)
    {
        if (await _repository.SlugExistsAsync(dto.Slug))
            throw new InvalidOperationException($"Uma Offer com o slug '{dto.Slug}' já existe.");

        var entity = dto.ToEntity();
        var created = await _repository.CreateAsync(entity);
        return created.ToDetails();
    }

    public async Task<OfferDetailsDto> UpdateAsync(UpdateOfferDto dto)
    {
        var existing = await _repository.GetByIdAsync(dto.Id);
        if (existing == null)
            throw new InvalidOperationException($"Offer com ID {dto.Id} não encontrada.");

        if (existing.Slug != dto.Slug && await _repository.SlugExistsAsync(dto.Slug, dto.Id))
            throw new InvalidOperationException($"Uma Offer com o slug '{dto.Slug}' já existe.");

        dto.Apply(existing);
        var updated = await _repository.UpdateAsync(existing);
        return updated.ToDetails();
    }

    public async Task DeleteAsync(Guid id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
            throw new InvalidOperationException($"Offer com ID {id} não encontrada.");

        await _repository.DeleteAsync(id);
    }

    public async Task<IEnumerable<OfferSummaryDto>> GetByRolesAsync(string[] roles)
    {
        var offers = await _repository.GetAllAsync();
        
        // Filtra offers que têm ao menos 1 role do usuário
        var filtered = offers.Where(o => 
            o.VisibleToRoles.Any(vr => roles.Contains(vr.RoleName))
        ).ToList();
        
        return filtered.Select(o => o.ToSummary());
    }
}
