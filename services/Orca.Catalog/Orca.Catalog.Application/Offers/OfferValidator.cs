using FluentValidation;
using Orca.Catalog.Domain.Entities;
using System.Linq;

namespace Orca.Catalog.Application.Offers
{
    public class OfferValidator : AbstractValidator<Offer>
    {
        public OfferValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("O nome é obrigatório.")
                .MaximumLength(100);

            RuleFor(x => x.Slug)
                .NotEmpty().WithMessage("O slug é obrigatório.")
                .MaximumLength(100)
                .Matches("^[a-z0-9-]+$").WithMessage("O slug deve conter apenas letras minúsculas, números e hífens.");

            RuleFor(x => x.Description)
                .MaximumLength(500);

            RuleForEach(x => x.Tags)
                .MaximumLength(30).WithMessage("Cada tag deve ter no máximo 30 caracteres.");

            RuleForEach(x => x.VisibleToRoles)
                .Must(v => !string.IsNullOrWhiteSpace(v.RoleName))
                .WithMessage("Cada role vinculada deve ter um nome válido.");
        }
    }
}