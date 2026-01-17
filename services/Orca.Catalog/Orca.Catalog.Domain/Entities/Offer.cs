namespace Orca.Catalog.Domain.Entities;
public class Offer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public bool Active { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdateAtUtc { get; set; }
    public ICollection<OfferVersion> Versions { get; set; } = new List<OfferVersion>();
    public ICollection<OfferRole> VisibleToRoles { get; set; } = new List<OfferRole>(); 
}