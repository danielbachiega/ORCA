using Orca.Catalog.Domain.Entities;

namespace Orca.Catalog.Application.Offers;
public static class OfferMapping
{
    public static OfferSummaryDto ToSummary(this Offer o)
        => new(o.Id, o.Slug, o.Name, o.Description, o.Tags, o.Active);
    
    public static OfferDetailsDto ToDetails(this Offer o)
    {
        var pub = o.Versions.FirstOrDefault(v => v.IsPublished);
        return new(o.Id, o.Slug, o.Name, o.Description, o.Tags, o.Active, pub?.VersionNumber, pub?.JsonSchema, pub?.UiSchema, pub?.ExecutionTemplate);
    }
}