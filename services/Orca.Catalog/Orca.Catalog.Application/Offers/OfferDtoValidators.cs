using FluentValidation;

namespace Orca.Catalog.Application.Offers;

public class CreateOfferDtoValidator : AbstractValidator<CreateOfferDto>
{
    public CreateOfferDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .MaximumLength(100).WithMessage("O nome não pode exceder 100 caracteres.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("O slug é obrigatório.")
            .MaximumLength(100).WithMessage("O slug não pode exceder 100 caracteres.")
            .Matches("^[a-z0-9-]+$").WithMessage("O slug deve conter apenas letras minúsculas, números e hífens.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("A descrição não pode exceder 500 caracteres.");

        RuleForEach(x => x.Tags)
            .MaximumLength(30).WithMessage("Cada tag deve ter no máximo 30 caracteres.");
    }
}

public class UpdateOfferDtoValidator : AbstractValidator<UpdateOfferDto>
{
    public UpdateOfferDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID é obrigatório.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome é obrigatório.")
            .MaximumLength(100).WithMessage("O nome não pode exceder 100 caracteres.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("O slug é obrigatório.")
            .MaximumLength(100).WithMessage("O slug não pode exceder 100 caracteres.")
            .Matches("^[a-z0-9-]+$").WithMessage("O slug deve conter apenas letras minúsculas, números e hífens.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("A descrição não pode exceder 500 caracteres.");

        RuleForEach(x => x.Tags)
            .MaximumLength(30).WithMessage("Cada tag deve ter no máximo 30 caracteres.");
    }
}
