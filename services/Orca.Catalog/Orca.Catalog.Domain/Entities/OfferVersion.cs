namespace Orca.Catalog.Domain.Entities;
public class OfferVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OfferId { get; set; }
    public Offer Offer { get; set; } = default!;
    public int VersionNumber { get; set; }
    public bool IsPublished { get; set; }
    public string? JsonSchema { get; set; }
    public string? UiSchema { get; set; }
    public string? ExecutionTemplate { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

}