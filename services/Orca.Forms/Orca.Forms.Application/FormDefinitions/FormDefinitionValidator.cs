using FluentValidation;
using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Application.FormDefinitions;

public class FormDefinitionValidator : AbstractValidator<FormDefinition>
{
    public FormDefinitionValidator()
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
