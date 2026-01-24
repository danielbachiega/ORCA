using FluentValidation;
using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Application.ExecutionTemplates;

public class CreateExecutionTemplateDtoValidator : AbstractValidator<CreateExecutionTemplateDto>
{
    public CreateExecutionTemplateDtoValidator()
    {
        RuleFor(x => x.FormDefinitionId)
            .NotEmpty()
            .WithMessage("FormDefinitionId é obrigatório");

        RuleFor(x => x.ResourceId)
            .NotEmpty()
            .WithMessage("ResourceId é obrigatório");

        // Se TargetType = AWX, ResourceType é obrigatório
        RuleFor(x => x.ResourceType)
            .NotNull()
            .When(x => x.TargetType == ExecutionTargetType.AWX)
            .WithMessage("ResourceType é obrigatório quando TargetType é AWX");

        // Se TargetType = OO, ResourceType deve ser null
        RuleFor(x => x.ResourceType)
            .Null()
            .When(x => x.TargetType == ExecutionTargetType.OO)
            .WithMessage("ResourceType deve ser null quando TargetType é OO");

        RuleFor(x => x.FieldMappings)
            .NotNull()
            .WithMessage("FieldMappings não pode ser null");

        RuleForEach(x => x.FieldMappings)
            .SetValidator(new FieldMappingDtoValidator());
    }
}

public class UpdateExecutionTemplateDtoValidator : AbstractValidator<UpdateExecutionTemplateDto>
{
    public UpdateExecutionTemplateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id é obrigatório");

        RuleFor(x => x.FormDefinitionId)
            .NotEmpty()
            .WithMessage("FormDefinitionId é obrigatório");

        RuleFor(x => x.ResourceId)
            .NotEmpty()
            .WithMessage("ResourceId é obrigatório");

        RuleFor(x => x.ResourceType)
            .NotNull()
            .When(x => x.TargetType == ExecutionTargetType.AWX)
            .WithMessage("ResourceType é obrigatório quando TargetType é AWX");

        RuleFor(x => x.ResourceType)
            .Null()
            .When(x => x.TargetType == ExecutionTargetType.OO)
            .WithMessage("ResourceType deve ser null quando TargetType é OO");

        RuleFor(x => x.FieldMappings)
            .NotNull()
            .WithMessage("FieldMappings não pode ser null");

        RuleForEach(x => x.FieldMappings)
            .SetValidator(new FieldMappingDtoValidator());
    }
}

public class FieldMappingDtoValidator : AbstractValidator<FieldMappingDto>
{
    public FieldMappingDtoValidator()
    {
        RuleFor(x => x.PayloadFieldName)
            .NotEmpty()
            .WithMessage("PayloadFieldName é obrigatório");

        RuleFor(x => x.SourceValue)
            .NotEmpty()
            .WithMessage("SourceValue é obrigatório");
    }
}