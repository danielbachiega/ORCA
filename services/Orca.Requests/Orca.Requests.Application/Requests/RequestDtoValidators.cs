using FluentValidation;
using Orca.Requests.Application.Requests;

namespace Orca.Requests.Application.Requests;

public class CreateRequestDtoValidator : AbstractValidator<CreateRequestDto>
{
    public CreateRequestDtoValidator()
    {
        RuleFor(x => x.OfferId)
            .NotEmpty().WithMessage("O ID da oferta é obrigatório.");

        RuleFor(x => x.FormDefinitionId)
            .NotEmpty().WithMessage("O ID da definição do formulário é obrigatório.");

        RuleFor(x => x.OfferName)
            .NotEmpty().WithMessage("O nome da oferta é obrigatório.")
            .MaximumLength(100).WithMessage("O nome da oferta não pode exceder 100 caracteres.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O ID do usuário é obrigatório.")
            .MaximumLength(256).WithMessage("O ID do usuário não pode exceder 256 caracteres.");

        RuleFor(x => x.FormData)
            .NotEmpty().WithMessage("Os dados do formulário são obrigatórios.")
            .Must(BeValidJson).WithMessage("FormData deve ser um JSON válido.");
    }

    private static bool BeValidJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return false;

        try
        {
            System.Text.Json.JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

public class UpdateRequestDtoValidator : AbstractValidator<UpdateRequestDto>
{
    public UpdateRequestDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID da requisição é obrigatório.");

        RuleFor(x => x.OfferId)
            .NotEmpty().WithMessage("O ID da oferta é obrigatório.");

        RuleFor(x => x.OfferName)
            .NotEmpty().WithMessage("O nome da oferta é obrigatório.")
            .MaximumLength(100).WithMessage("O nome da oferta não pode exceder 100 caracteres.");

        RuleFor(x => x.FormDefinitionId)
            .NotEmpty().WithMessage("O ID da definição do formulário é obrigatório.");

        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O ID do usuário é obrigatório.")
            .MaximumLength(256).WithMessage("O ID do usuário não pode exceder 256 caracteres.");

        RuleFor(x => x.FormData)
            .NotEmpty().WithMessage("Os dados do formulário são obrigatórios.")
            .Must(BeValidJson).WithMessage("FormData deve ser um JSON válido.");

        RuleFor(x => x.Status)
            .GreaterThanOrEqualTo(0).WithMessage("Status inválido.")
            .LessThanOrEqualTo(3).WithMessage("Status deve estar entre 0 e 3 (Pending, Running, Success, Failed).");
    }

    private static bool BeValidJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return false;

        try
        {
            System.Text.Json.JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
}