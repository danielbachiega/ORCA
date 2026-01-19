namespace Orca.Catalog.Domain.Entities;

public class FormDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OfferId { get; set; }
    public Offer Offer { get; set; } = default!;
    public int Version { get; set; }
    public string JsonSchema { get; set; } = default!;
    public string? UiSchema { get; set; }
    public string? Rules { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}