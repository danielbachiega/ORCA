using Orca.Catalog.Domain.Entities;

namespace Orca.Catalog.Application.Offers;
public static class OfferMapping
{
    public static OfferSummaryDto ToSummary(this Offer o)
        => new(o.Id, o.Slug, o.Name, o.Description, o.Tags, o.Active, o.CreatedAtUtc, o.UpdatedAtUtc);
    
    public static OfferDetailsDto ToDetails(this Offer o)
    {
        return new(o.Id, o.Slug, o.Name, o.Description, o.Tags, o.Active, o.CreatedAtUtc, o.UpdatedAtUtc, o.VisibleToRoles.Select(r => r.RoleName).ToArray());
    }
    
    // DTO → Domain (Entrada)
    public static Offer ToEntity(this CreateOfferDto dto)
        => new()
        {
            Slug = dto.Slug,
            Name = dto.Name,
            Description = dto.Description,
            Tags = dto.Tags,
            Active = dto.Active,
            VisibleToRoles = dto.VisibleToRoles
                .Select(role => new OfferRole { RoleName = role })
                .ToList()
        };

    public static Offer Apply(this UpdateOfferDto dto, Offer entity)
    {
        entity.Slug = dto.Slug;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Tags = dto.Tags;
        entity.Active = dto.Active;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        entity.VisibleToRoles.Clear();
        foreach (var role in dto.VisibleToRoles)
        {
            entity.VisibleToRoles.Add(new OfferRole { RoleName = role });
        }

        return entity;
    }
}
