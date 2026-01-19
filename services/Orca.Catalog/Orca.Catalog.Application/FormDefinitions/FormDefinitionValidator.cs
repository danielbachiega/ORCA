using FluentValidation;
using Orca.Catalog.Domain.Entities;

namespace Orca.Catalog.Application.FormDefinitions;

public class FormDefinitionValidator : AbstractValidator<FormDefinition>
{
    public FormDefinitionValidator()
    {
        RuleFor(x => x.OfferId)
            .NotEmpty().WithMessage("O ID da oferta é obrigatório.");

        RuleFor(x => x.Version)
            .GreaterThan(0).WithMessage("A versão deve ser maior que zero.");

        RuleFor(x => x.JsonSchema)
            .NotEmpty().WithMessage("O JSON Schema é obrigatório.")
            .Must(BeValidJson).WithMessage("O JsonSchema deve ser um JSON válido.");

        RuleFor(x => x.UiSchema)
            .MaximumLength(5000).WithMessage("O UI Schema não pode ter mais de 5000 caracteres.")
            .Must(BeValidJsonOrNull).WithMessage("O UiSchema, se preenchido, deve ser um JSON válido.");

        RuleFor(x => x.Rules)
            .MaximumLength(5000).WithMessage("As regras não podem ter mais de 5000 caracteres.")
            .Must(BeValidJsonOrNull).WithMessage("As Rules, se preenchidas, devem ser um JSON válido.");
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