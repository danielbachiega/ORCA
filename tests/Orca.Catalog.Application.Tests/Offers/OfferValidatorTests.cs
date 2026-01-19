using FluentAssertions;
using Orca.Catalog.Application.Offers;
using Orca.Catalog.Domain.Entities;
using Xunit;

namespace Orca.Catalog.Application.Tests.Offers
{
    public class OfferValidatorTests
    {
        private readonly OfferValidator _validator = new();

        [Fact]
        public void Should_Have_Error_When_Name_Is_Empty()
        {
            var offer = new Offer { Name = "", Slug = "valid-slug" };
            var result = _validator.Validate(offer);
            result.Errors.Should().Contain(x => x.PropertyName == "Name");
        }

        [Fact]
        public void Should_Have_Error_When_Slug_Is_Invalid()
        {
            var offer = new Offer { Name = "Valid Name", Slug = "Slug Com Espaço" };
            var result = _validator.Validate(offer);
            result.Errors.Should().Contain(x => x.PropertyName == "Slug");
        }

        [Fact]
        public void Should_Have_Error_When_Tag_Too_Long()
        {
            var offer = new Offer { Name = "Valid Name", Slug = "valid-slug", Tags = new[] { new string('a', 31) } };
            var result = _validator.Validate(offer);
            result.Errors.Should().Contain(x => x.PropertyName == "Tags[0]");
        }

        [Fact]
        public void Should_Be_Valid_When_All_Fields_Are_Correct()
        {
            var offer = new Offer
            {
                Name = "Valid Name",
                Slug = "valid-slug",
                Description = "Descrição válida",
                Tags = new[] { "infra", "cloud" },
                VisibleToRoles = new[] { new OfferRole { RoleName = "ADMIN" } }
            };
            var result = _validator.Validate(offer);
            result.IsValid.Should().BeTrue();
        }
    }
}
