namespace Orca.Forms.Domain.Entities;

public class FormDefinition
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OfferId { get; set; }
    public int Version { get; set; }
    public string SchemaJson { get; set; } = default!;
    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}
