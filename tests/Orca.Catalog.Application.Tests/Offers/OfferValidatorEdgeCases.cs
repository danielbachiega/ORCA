using Xunit;
using FluentAssertions;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Application.Offers;

namespace Orca.Catalog.Application.Tests.Offers
{
    public class OfferValidatorEdgeCases
    {
        private readonly OfferValidator _validator = new();

        [Fact]
        public void Should_Be_Valid_When_VisibleToRoles_Is_Empty()
        {
            var offer = new Offer { Name = "Valid Name", Slug = "valid-slug", VisibleToRoles = new List<OfferRole>() };
            var result = _validator.Validate(offer);
            result.IsValid.Should().BeTrue();
        }

        [Fact]
        public void Should_Have_Error_When_VisibleToRoles_Has_Empty_RoleName()
        {
            var offer = new Offer { Name = "Valid Name", Slug = "valid-slug", VisibleToRoles = new[] { new OfferRole { RoleName = "" } } };
            var result = _validator.Validate(offer);
            result.Errors.Should().Contain(x => x.PropertyName.Contains("VisibleToRoles"));
        }
    }
}
