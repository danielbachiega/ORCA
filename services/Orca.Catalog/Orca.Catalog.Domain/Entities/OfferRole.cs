namespace Orca.Catalog.Domain.Entities;

public class OfferRole
{
    public Guid OfferId { get; set; }
    public Offer Offer { get; set; } = default!;
    public string RoleName { get; set; } = default!;
}