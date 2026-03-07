using FluentValidation;

namespace Orca.Catalog.Application.ImageAssets;

public class CreateImageAssetDtoValidator : AbstractValidator<CreateImageAssetDto>
{
    public CreateImageAssetDtoValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().MaximumLength(100)
            .Matches("^[a-z0-9-]+$");

        RuleFor(x => x.Name)
            .NotEmpty().MaximumLength(150);

        RuleFor(x => x.Url)
            .NotEmpty().MaximumLength(500);
    }
}