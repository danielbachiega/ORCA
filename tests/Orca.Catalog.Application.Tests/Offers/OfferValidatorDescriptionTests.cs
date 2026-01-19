using Xunit;
using FluentAssertions;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Application.Offers;

namespace Orca.Catalog.Application.Tests.Offers
{
    public class OfferValidatorDescriptionTests
    {
        private readonly OfferValidator _validator = new();

        [Fact]
        public void Should_Have_Error_When_Description_Too_Long()
        {
            var offer = new Offer
            {
                Name = "Valid Name",
                Slug = "valid-slug",
                Description = new string('a', 501)
            };
            var result = _validator.Validate(offer);
            result.Errors.Should().Contain(x => x.PropertyName == "Description");
        }
    }
}
