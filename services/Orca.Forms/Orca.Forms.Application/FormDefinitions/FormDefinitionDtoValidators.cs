using FluentValidation;
using Orca.Forms.Application.FormDefinitions;

namespace Orca.Forms.Application.FormDefinitions;

public class CreateFormDefinitionDtoValidator : AbstractValidator<CreateFormDefinitionDto>
{
    public CreateFormDefinitionDtoValidator()
    {
        RuleFor(x => x.OfferId)
            .NotEmpty().WithMessage("O ID da oferta é obrigatório.");

        RuleFor(x => x.Version)
            .GreaterThan(0).WithMessage("A versão deve ser maior que zero.");

        RuleFor(x => x.SchemaJson)
            .NotEmpty().WithMessage("O JSON Schema é obrigatório.")
            .Must(BeValidJson).WithMessage("O SchemaJson deve ser um JSON válido.");
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

    private static bool BeValidJsonOrNull(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return true;

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

public class UpdateFormDefinitionDtoValidator : AbstractValidator<UpdateFormDefinitionDto>
{
    public UpdateFormDefinitionDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O ID é obrigatório.");

        RuleFor(x => x.OfferId)
            .NotEmpty().WithMessage("O ID da oferta é obrigatório.");

        RuleFor(x => x.Version)
            .GreaterThan(0).WithMessage("A versão deve ser maior que zero.");

        RuleFor(x => x.SchemaJson)
            .NotEmpty().WithMessage("O JSON Schema é obrigatório.")
            .Must(BeValidJson).WithMessage("O SchemaJson deve ser um JSON válido.");
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

    private static bool BeValidJsonOrNull(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return true;

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
