namespace Orca.Catalog.Domain.Entities;

public class FormDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OfferId { get; set; }
    public Offer? Offer { get; set; }
    public int Version { get; set; }
    public string JsonSchema { get; set; } = default!;
    public string? UiSchema { get; set; }
    public string? Rules { get; set; }
    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}